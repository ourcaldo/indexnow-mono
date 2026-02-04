import { supabaseBrowser as supabase } from '@indexnow/database';
import { type RankTrackingDomain } from '@indexnow/shared';

export class RankTrackingService {
  /**
   * Get all domains for a user with stats
   */
  async getUserDomains(userId: string): Promise<RankTrackingDomain[]> {
    const { data, error } = await supabase.rpc('get_user_domain_stats', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user domains:', error);
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
   * Update keyword position
   * OPTIMIZED: Uses atomic SQL update to prevent race conditions
   */
  private async updateKeywordPosition(keywordId: string, newPosition: number): Promise<void> {
    // Perform atomic update using RPC if available, or direct update with minimal RTT
    // Since Supabase doesn't support "update indb_rank_keywords set previous_position = position, position = X"
    // in a single standard PostgREST call easily without a stored procedure for the atomic swap,
    // we will create a dedicated RPC for this to ensure atomicity.

    const { error } = await supabase.rpc('update_keyword_position_atomic', {
      target_keyword_id: keywordId,
      new_rank_position: newPosition
    });

    if (error) {
        // Fallback to standard update if RPC fails or doesn't exist
        console.warn('Atomic update failed, falling back to standard update', error);
        
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
    // tags = array_distinct(tags || new_tags)
    const { data: updatedCount, error } = await supabase.rpc('add_tags_to_keywords_atomic', {
        target_keyword_ids: keywordIds,
        target_user_id: userId,
        new_tags: tags
    });

    if (error) {
        console.warn('Atomic tag update failed, falling back to standard update', error);
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
