import { db } from '@indexnow/database';
import { 
  RANK_TRACKING, 
  type RankKeyword, 
  type RankHistory, 
  type RankTrackingDomain, 
  type RankCheckRequest, 
  type RankCheckResult, 
  type RankTrackingQuota,
  type Device,
  type SearchEngine,
  type CountryCode,
  type Database,
  type DbRankKeywordRow,
  type Json,
  supabaseBrowser as supabase
} from '@indexnow/shared';
import { type SupabaseClient } from '@supabase/supabase-js';

const typedSupabase = supabase as SupabaseClient<Database>;

export class RankTrackingService {
  /**
   * Create a new keyword for tracking
   */
  async createKeyword(userId: string, keywordData: {
    keyword: string;
    domain: string;
    country: CountryCode;
    device?: Device;
    searchEngine?: SearchEngine;
    targetUrl?: string;
    tags?: string[];
  }): Promise<RankKeyword> {
    const data = {
      user_id: userId,
      keyword: keywordData.keyword.trim(),
      domain: keywordData.domain,
      country: keywordData.country,
      device: keywordData.device || 'desktop',
      search_engine: keywordData.searchEngine || 'google',
      target_url: keywordData.targetUrl,
      tags: keywordData.tags || [],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data: keyword, error } = await typedSupabase
      .from('indb_rank_keywords')
      .insert(data)
      .select()
      .single();
    
    if (error || !keyword) {
      throw new Error(`Failed to create keyword: ${error?.message}`);
    }

    return this.mapDatabaseKeywordToModel(keyword);
  }

  /**
   * Get keyword by ID
   */
  async getKeyword(keywordId: string, userId?: string): Promise<RankKeyword | null> {
    let query = typedSupabase
      .from('indb_rank_keywords')
      .select('*')
      .eq('id', keywordId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();
    
    if (error || !data) {
      return null;
    }

    return this.mapDatabaseKeywordToModel(data);
  }

  /**
   * Get user keywords with filtering and pagination
   */
  async getUserKeywords(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      domain?: string;
      country?: string;
      device?: string;
      searchEngine?: string;
      tags?: string[];
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ keywords: RankKeyword[]; total: number }> {
    const { page = 1, limit = 10, domain, country, device, searchEngine, tags, isActive, search } = options;
    const offset = (page - 1) * limit;
    
    let query = typedSupabase
      .from('indb_rank_keywords')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (domain) query = query.eq('domain', domain);
    if (country) query = query.eq('country', country);
    if (device) query = query.eq('device', device);
    if (searchEngine) query = query.eq('search_engine', searchEngine);
    if (isActive !== undefined) query = query.eq('is_active', isActive);

    // Apply tag filtering
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    // Apply search
    if (search) {
      query = query.or(`keyword.ilike.%${search}%, domain.ilike.%${search}%`);
    }

    // Apply ordering and pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch keywords: ${error.message}`);
    }

    const keywords = data?.map(keyword => this.mapDatabaseKeywordToModel(keyword)) || [];
    
    return {
      keywords,
      total: count || 0,
    };
  }

  /**
   * Update keyword
   */
  async updateKeyword(
    keywordId: string,
    userId: string,
    updates: Partial<RankKeyword>
  ): Promise<RankKeyword> {
    const updateData: Database['public']['Tables']['indb_rank_keywords']['Update'] = {};

    if (updates.keyword) updateData.keyword = updates.keyword.trim();
    if (updates.domain) updateData.domain = updates.domain;
    if (updates.country) updateData.country = updates.country;
    if (updates.device) updateData.device = updates.device;
    if (updates.searchEngine) updateData.search_engine = updates.searchEngine;
    if (updates.targetUrl !== undefined) updateData.target_url = updates.targetUrl;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await typedSupabase
      .from('indb_rank_keywords')
      .update(updateData)
      .eq('id', keywordId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update keyword: ${error?.message}`);
    }

    return this.mapDatabaseKeywordToModel(data);
  }

  /**
   * Delete keywords
   */
  async deleteKeywords(keywordIds: string[], userId: string): Promise<number> {
    const { error, count } = await typedSupabase
      .from('indb_rank_keywords')
      .delete({ count: 'exact' })
      .in('id', keywordIds)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete keywords: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Add tags to keywords
   */
  async addTagsToKeywords(
    keywordIds: string[],
    userId: string,
    tags: string[]
  ): Promise<number> {
    const { data: keywords, error } = await typedSupabase
      .from('indb_rank_keywords')
      .select('id, tags')
      .in('id', keywordIds)
      .eq('user_id', userId);

    if (error || !keywords || keywords.length === 0) return 0;

    let updatedCount = 0;
    for (const keyword of keywords) {
      const existingTags = (keyword.tags as string[] | null) || [];
      const newTags = Array.from(new Set([...existingTags, ...tags]));
      
      if (newTags.length !== existingTags.length) {
        await typedSupabase
          .from('indb_rank_keywords')
          .update({ tags: newTags })
          .eq('id', keyword.id);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Check ranks for keywords
   */
  async checkRanks(request: RankCheckRequest): Promise<RankCheckResult[]> {
    const results: RankCheckResult[] = [];

    for (const keywordId of request.keywordIds) {
      try {
        const keyword = await this.getKeyword(keywordId);
        if (!keyword) {
          results.push({
            keywordId,
            keyword: 'Unknown',
            domain: 'Unknown',
            position: -1,
            positionChange: 0,
            checkedAt: new Date(),
            success: false,
            error: 'Keyword not found',
          });
          continue;
        }

        // Check if we should skip if recently checked and not forcing refresh
        if (!request.forceRefresh && keyword.lastChecked) {
          const timeSinceLastCheck = Date.now() - keyword.lastChecked.getTime();
          const oneHour = 60 * 60 * 1000;
          
          if (timeSinceLastCheck < oneHour) {
            results.push({
              keywordId: keyword.id,
              keyword: keyword.keyword,
              domain: keyword.domain,
              position: keyword.currentPosition || -1,
              previousPosition: keyword.previousPosition,
              positionChange: (keyword.currentPosition || 0) - (keyword.previousPosition || 0),
              targetUrl: keyword.targetUrl,
              checkedAt: keyword.lastChecked,
              success: true,
            });
            continue;
          }
        }

        // Perform rank check using ScrapingDog API or similar service
        const rankResult = await this.performRankCheck(keyword);
        
        // Update keyword with new position
        await this.updateKeywordPosition(keyword.id, rankResult.position);
        
        // Save rank history
        await this.saveRankHistory(keyword.id, rankResult.position, rankResult.searchResults);

        results.push({
          keywordId: keyword.id,
          keyword: keyword.keyword,
          domain: keyword.domain,
          position: rankResult.position,
          previousPosition: keyword.currentPosition,
          positionChange: rankResult.position - (keyword.currentPosition || 0),
          targetUrl: keyword.targetUrl,
          actualUrl: rankResult.actualUrl,
          checkedAt: new Date(),
          success: true,
          searchResults: rankResult.searchResults,
        });

        // Add delay between checks to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.push({
          keywordId,
          keyword: 'Unknown',
          domain: 'Unknown',
          position: -1,
          positionChange: 0,
          checkedAt: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get rank history for a keyword
   */
  async getRankHistory(
    keywordId: string,
    options: {
      days?: number;
      limit?: number;
    } = {}
  ): Promise<RankHistory[]> {
    const { days = 30, limit = 100 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await typedSupabase
      .from('indb_keyword_rank_history')
      .select('*')
      .eq('keyword_id', keywordId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch rank history: ${error.message}`);
    }

    return data?.map(history => ({
      id: history.id,
      keywordId: history.keyword_id,
      position: history.position ?? -1,
      checkedAt: new Date(history.checked_at),
      searchResults: (history.metadata as Record<string, any> | null)?.searchResults,
    })) || [];
  }

  /**
   * Get user domains
   */
  async getUserDomains(userId: string): Promise<RankTrackingDomain[]> {
    // Get distinct domains from keywords
    const { data: keywords, error } = await typedSupabase
      .from('indb_rank_keywords')
      .select('domain')
      .eq('user_id', userId);

    if (error || !keywords) return [];

    const domainCounts = keywords.reduce((acc: Record<string, number>, keyword: { domain: string | null }) => {
      if (keyword.domain) {
        acc[keyword.domain] = (acc[keyword.domain] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(domainCounts).map(([domain, count]) => ({
      id: domain,
      userId,
      domain,
      name: domain,
      isActive: true,
      keywordCount: count,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Get keyword usage statistics
   */
  async getKeywordUsage(userId: string): Promise<RankTrackingQuota> {
    const { data, count, error } = await typedSupabase
      .from('indb_rank_keywords')
      .select('id, is_active', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to fetch keyword usage: ${error.message}`);
    }

    const totalKeywords = count || 0;
    
    // Get user's keyword limit from their package
    const userProfile = await db.getUserProfile(userId);

    const keywordLimit = userProfile?.quotaLimits.dailyUrls || 10;
    const remainingKeywords = Math.max(0, keywordLimit - totalKeywords);

    return {
      totalKeywords: keywordLimit,
      usedKeywords: totalKeywords,
      remainingKeywords,
      dailyChecks: 100, // Default or from profile
      usedChecks: 0, // Should track this separately
      remainingChecks: 100,
      resetDate: new Date(),
    };
  }

  /**
   * Get available countries for rank tracking
   */
  getAvailableCountries(): Array<{ code: string; name: string }> {
    return Object.entries(RANK_TRACKING.COUNTRIES).map(([code, name]) => ({
      code,
      name,
    }));
  }

  /**
   * Perform actual rank check using external API
   */
  private async performRankCheck(keyword: RankKeyword): Promise<{
    position: number;
    actualUrl?: string;
    searchResults?: Record<string, any>[];
  }> {
    try {
      // This would integrate with ScrapingDog API or similar service
      // For now, return mock data
      const mockPosition = Math.floor(Math.random() * 100) + 1;
      
      return {
        position: mockPosition,
        actualUrl: `https://${keyword.domain}/page`,
        searchResults: [
          {
            position: mockPosition,
            url: `https://${keyword.domain}/page`,
            title: 'Mock Search Result',
            snippet: 'This is a mock search result snippet.',
            domain: keyword.domain,
            isTargetDomain: true,
          }
        ],
      };
    } catch (error) {
      throw new Error(`Rank check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update keyword position
   */
  private async updateKeywordPosition(keywordId: string, newPosition: number): Promise<void> {
    // Get current position to set as previous
    const { data: currentKeyword } = await typedSupabase
      .from('indb_rank_keywords')
      .select('position')
      .eq('id', keywordId)
      .single();

    const previousPosition = currentKeyword?.position;

    await typedSupabase
      .from('indb_rank_keywords')
      .update({
        position: newPosition,
        previous_position: previousPosition,
        last_checked: new Date().toISOString(),
      })
      .eq('id', keywordId);
  }

  /**
   * Save rank history record
   */
  private async saveRankHistory(
    keywordId: string,
    position: number,
    searchResults?: Record<string, any>[]
  ): Promise<void> {
    await typedSupabase
      .from('indb_keyword_rank_history')
      .insert({
        keyword_id: keywordId,
        position,
        metadata: { searchResults } as Json,
        checked_at: new Date().toISOString(),
      });
  }

  /**
   * Map database keyword to model
   */
  private mapDatabaseKeywordToModel(data: DbRankKeywordRow): RankKeyword {
    return {
      id: data.id,
      userId: data.user_id,
      keyword: data.keyword,
      domain: data.domain || '',
      country: data.country as CountryCode,
      device: data.device as Device,
      searchEngine: (data.search_engine as SearchEngine) || 'google',
      targetUrl: data.target_url || undefined,
      tags: (data.tags as string[]) || [],
      isActive: data.is_active ?? true,
      currentPosition: data.position || undefined,
      previousPosition: data.previous_position || undefined,
      lastChecked: data.last_checked ? new Date(data.last_checked) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.created_at ? new Date(data.created_at) : new Date(), // Using created_at as fallback
    };
  }
}

export default RankTrackingService;
