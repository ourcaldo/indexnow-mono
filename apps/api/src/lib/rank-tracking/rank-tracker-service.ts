import { supabaseAdmin, toJson } from '@indexnow/database';
import { logger } from '../monitoring/error-handling';
import { RankTracker, RankResult } from './rank-tracker';
import { removeUrlParameters } from '@indexnow/shared';

const adminClient = supabaseAdmin;

export class RankTrackerService {
  /**
   * Process a single rank check job and update database.
   *
   * Uses real table names: indb_rank_keywords, indb_keyword_rankings, indb_keyword_domains.
   */
  static async processRankCheck(
    keywordId: string,
    _userId: string,
    domainId: string,
    keyword: string,
    country: string,
    device: 'desktop' | 'mobile'
  ): Promise<RankResult> {
    try {
      // 1. Get domain name
      const { data: domainData, error: domainError } = await adminClient
        .from('indb_keyword_domains')
        .select('domain_name')
        .eq('id', domainId)
        .single();

      if (domainError || !domainData) {
        throw new Error(`Domain not found: ${domainId}`);
      }

      // 2. Get current position for previous_position tracking
      const { data: currentKeyword } = await adminClient
        .from('indb_rank_keywords')
        .select('position')
        .eq('id', keywordId)
        .single();

      // 3. Perform rank check
      const result = await RankTracker.checkRank(keyword, domainData.domain_name, country, device);

      // 4. Update keyword position and last check timestamp
      await adminClient
        .from('indb_rank_keywords')
        .update({
          last_checked: new Date().toISOString(),
          is_active: true,
          position: result.position,
          previous_position: currentKeyword?.position ?? null,
        })
        .eq('id', keywordId);

      // 5. Store rank history in indb_keyword_rankings
      await adminClient.from('indb_keyword_rankings').insert({
        keyword_id: keywordId,
        position: result.position,
        url: removeUrlParameters(result.url),
        check_date: new Date().toISOString().split('T')[0],
        device_type: device,
        metadata: toJson(result),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { error: errorMessage, keywordId },
        'RankTrackerService: Failed to process rank check'
      );

      // Update keyword — mark inactive on error
      await adminClient
        .from('indb_rank_keywords')
        .update({
          is_active: false,
        })
        .eq('id', keywordId);

      throw error;
    }
  }
}
