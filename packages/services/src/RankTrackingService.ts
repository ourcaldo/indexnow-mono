import { supabaseBrowser as supabase } from '@indexnow/database';
import { type RankTrackingDomain, logger, ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared';
import { QuotaService } from './monitoring/QuotaService';

export class RankTrackingService {
  /**
   * Get all domains for a user with stats
   */
  async getUserDomains(userId: string): Promise<RankTrackingDomain[]> {
    const { data, error } = await supabase.rpc('get_user_domain_stats', {
      target_user_id: userId
    });

    if (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error fetching user domains');
      throw error;
    }

    return (data || []).map(item => ({
      id: item.domain,
      userId: userId,
      domain: item.domain,
      name: item.domain,
      isActive: true,
      keywordCount: item.keyword_count,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * Create a new keyword for tracking
   * Enforces Quota Consumption
   */
  async createKeyword(userId: string, keywordData: {
    keyword: string;
    domain: string;
    country: string;
    device?: 'desktop' | 'mobile';
    targetUrl?: string;
    tags?: string[];
  }): Promise<any> {
    // 1. Check & Consume Quota
    const quotaConsumed = await QuotaService.consumeQuota(userId, 1);
    if (!quotaConsumed) {
      throw ErrorHandlingService.createError({ message: 'Insufficient quota to track new keyword', type: ErrorType.VALIDATION, severity: ErrorSeverity.MEDIUM });
    }

    const data = {
      user_id: userId,
      keyword: keywordData.keyword.trim(),
      domain: keywordData.domain,
      country: keywordData.country,
      device: keywordData.device || 'desktop',
      tags: keywordData.tags || [],
      created_at: new Date().toISOString(),
      last_checked: new Date().toISOString(),
    };

    const { data: keyword, error } = await supabase
      .from('indb_rank_keywords')
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to create keyword');
      throw ErrorHandlingService.createError({ message: `Failed to create keyword: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH });
    }

    return keyword;
  }

  /**
   * Delete keywords
   */
  async deleteKeywords(keywordIds: string[], userId: string): Promise<number> {
    const { error, count } = await supabase
      .from('indb_rank_keywords')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .in('id', keywordIds);

    if (error) {
      throw ErrorHandlingService.createError({ message: `Failed to delete keywords: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH });
    }

    return count || 0;
  }

  /**
   * Get user keywords with filtering
   */
  async getUserKeywords(userId: string, options: any = {}): Promise<{ keywords: any[]; total: number }> {
    let query = supabase
      .from('indb_rank_keywords')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options.domain) query = query.eq('domain', options.domain);
    if (options.limit) query = query.limit(options.limit);

    const { data, count, error } = await query;

    if (error) {
      throw ErrorHandlingService.createError({ message: `Failed to fetch keywords: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH });
    }

    return { keywords: data || [], total: count || 0 };
  }

  /**
   * Update keyword position
   * OPTIMIZED: Uses atomic SQL update to prevent race conditions
   */
  private async updateKeywordPosition(keywordId: string, newPosition: number): Promise<void> {
    // Perform atomic update using RPC if available, or direct update with minimal RTT
    const { error } = await supabase.rpc('update_keyword_position_atomic', {
      target_keyword_id: keywordId,
      new_rank_position: newPosition
    });

    if (error) {
      // Fallback to standard update if RPC fails or doesn't exist
      logger.warn({ error: error instanceof Error ? error : undefined }, 'Atomic update failed, falling back to standard update');

      const { data: currentKeyword } = await supabase
        .from('indb_rank_keywords')
        .select('position')
        .eq('id', keywordId)
        .single();

      const previousPosition = currentKeyword?.position ?? null;

      await supabase
        .from('indb_rank_keywords')
        .update({
          position: newPosition,
          previous_position: previousPosition,
          last_checked: new Date().toISOString(),
        })
        .eq('id', keywordId);
    }
  }

  /**
   * Add tags to keywords
   * OPTIMIZED: Uses atomic array append
   */
  async addTagsToKeywords(
    keywordIds: string[],
    userId: string,
    tags: string[]
  ): Promise<number> {
    if (!tags || tags.length === 0) return 0;

    // Use Postgres array concatenation operator via RPC for atomicity
    const { data: updatedCount, error } = await supabase.rpc('add_tags_to_keywords_atomic', {
      target_keyword_ids: keywordIds,
      target_user_id: userId,
      new_tags: tags
    });

    if (error) {
      logger.warn({ error: error instanceof Error ? error : undefined }, 'Atomic tag update failed, falling back to standard update');
      // Fallback to original read-modify-write logic
      const { data: keywords, error: fetchError } = await supabase
        .from('indb_rank_keywords')
        .select('id, tags')
        .in('id', keywordIds)
        .eq('user_id', userId);

      if (fetchError || !keywords || keywords.length === 0) return 0;

      let count = 0;
      for (const keyword of keywords) {
        const existingTags = (keyword.tags as string[] | null) || [];
        const newTags = Array.from(new Set([...existingTags, ...tags]));

        if (newTags.length !== existingTags.length) {
          await supabase
            .from('indb_rank_keywords')
            .update({ tags: newTags })
            .eq('id', keyword.id);
          count++;
        }
      }
      return count;
    }

    return updatedCount || 0;
  }
}
