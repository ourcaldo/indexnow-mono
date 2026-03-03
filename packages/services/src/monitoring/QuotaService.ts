/**
 * QuotaService — Server-side account quota management utility.
 *
 * Account-level limits are defined in indb_payment_packages.quota_limits JSONB:
 *   { max_keywords: number, max_domains: number }
 *
 * Usage is derived by counting actual rows (indb_rank_keywords, indb_keyword_domains).
 * There is NO daily quota — limits are permanent for the subscription duration.
 */
import { typedSupabaseAdmin as supabaseServiceRole } from '@indexnow/database';
import { logger } from '@indexnow/shared';

export class QuotaService {
  /**
   * Check if user can add more keywords based on their package limit.
   * Returns true if the user has remaining keyword capacity.
   */
  static async canAddKeyword(userId: string, count: number = 1): Promise<boolean> {
    try {
      // Count all keywords — no is_active filter (keywords are hard-deleted, not soft-deleted)
      const { count: currentCount, error: countError } = await supabaseServiceRole
        .from('indb_rank_keywords')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logger.error({ error: countError instanceof Error ? countError : undefined }, 'Error counting keywords');
        return false;
      }

      // Get package limit
      const limit = await QuotaService.getKeywordLimit(userId);
      if (limit === -1) return true; // unlimited

      return (currentCount || 0) + count <= limit;
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error in canAddKeyword');
      return false;
    }
  }

  /**
   * Check if user can add more domains based on their package limit.
   * Returns true if the user has remaining domain capacity.
   */
  static async canAddDomain(userId: string, count: number = 1): Promise<boolean> {
    try {
      // Count all domains — no is_active filter (domains are hard-deleted, not soft-deleted)
      const { count: currentCount, error: countError } = await supabaseServiceRole
        .from('indb_keyword_domains')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        logger.error({ error: countError instanceof Error ? countError : undefined }, 'Error counting domains');
        return false;
      }

      // Get package limit
      const limit = await QuotaService.getDomainLimit(userId);
      if (limit === -1) return true; // unlimited

      return (currentCount || 0) + count <= limit;
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Error in canAddDomain');
      return false;
    }
  }

  /**
   * Get the max_keywords limit for a user from their package.
   * Returns -1 for unlimited, or the numeric limit.
   */
  static async getKeywordLimit(userId: string): Promise<number> {
    const quotaLimits = await QuotaService.getQuotaLimits(userId);
    if (quotaLimits.max_keywords == null) {
      throw new Error(`User ${userId} package is missing max_keywords in quota_limits`);
    }
    return quotaLimits.max_keywords;
  }

  /**
   * Get the max_domains limit for a user from their package.
   * Returns -1 for unlimited, or the numeric limit.
   */
  static async getDomainLimit(userId: string): Promise<number> {
    const quotaLimits = await QuotaService.getQuotaLimits(userId);
    if (quotaLimits.max_domains == null) {
      throw new Error(`User ${userId} package is missing max_domains in quota_limits`);
    }
    return quotaLimits.max_domains;
  }

  /**
   * Internal: fetch quota_limits JSONB from the user's package.
   */
  private static async getQuotaLimits(userId: string): Promise<Record<string, number>> {
    const { data: profile, error } = await supabaseServiceRole
      .from('indb_auth_user_profiles')
      .select('package:indb_payment_packages(quota_limits)')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new Error(`Failed to fetch package for user ${userId}: ${error?.message || 'profile not found'}`);
    }

    const pkg = Array.isArray(profile.package) ? profile.package[0] : profile.package;
    const quotaLimits = pkg?.quota_limits as Record<string, number> | null;
    if (!quotaLimits) {
      throw new Error(`User ${userId} package is missing quota_limits`);
    }
    return quotaLimits;
  }
}
