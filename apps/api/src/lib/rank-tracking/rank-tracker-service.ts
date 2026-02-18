import { supabaseAdmin, untypedFrom } from '@indexnow/database';
import { logger } from '../monitoring/error-handling';
import { RankTracker, RankResult } from './rank-tracker';
import { removeUrlParameters } from '@indexnow/shared';

const adminClient = supabaseAdmin;

export class RankTrackerService {
  /**
   * Process a single rank check job and update database
   */
  static async processRankCheck(
    keywordId: string,
    userId: string,
    domainId: string,
    keyword: string,
    country: string,
    device: 'desktop' | 'mobile'
  ): Promise<RankResult> {
    try {
      // 1. Get domain name
      const { data: domainData, error: domainError } = await untypedFrom(
        adminClient,
        'indb_domains'
      )
        .select('domain_name')
        .eq('id', domainId)
        .single();

      if (domainError || !domainData) {
        throw new Error(`Domain not found: ${domainId}`);
      }

      // 2. Perform rank check
      const result = await RankTracker.checkRank(keyword, domainData.domain_name, country, device);

      // 3. Update keyword status and last check timestamp
      await untypedFrom(adminClient, 'indb_keywords')
        .update({
          last_check_at: new Date().toISOString(),
          status: 'active',
          last_position: result.position,
          error_message: result.error || null,
        })
        .eq('id', keywordId);

      // 4. Store rank history
      await untypedFrom(adminClient, 'indb_rank_history').insert({
        keyword_id: keywordId,
        user_id: userId,
        domain_id: domainId,
        position: result.position,
        found_url: removeUrlParameters(result.url),
        found_title: result.title,
        device: device,
        country: country,
        checked_at: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { error: errorMessage, keywordId },
        'RankTrackerService: Failed to process rank check'
      );

      // Update keyword with error status
      await untypedFrom(adminClient, 'indb_keywords')
        .update({
          status: 'error',
          error_message: errorMessage,
        })
        .eq('id', keywordId);

      throw error;
    }
  }
}
