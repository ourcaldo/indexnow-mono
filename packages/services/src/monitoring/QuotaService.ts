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
      // Get current keyword count
      const { count: currentCount, error: countError } = await supabaseServiceRole
        .from('indb_rank_keywords')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

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
   * Get the max_keywords limit for a user from their package.
   * Returns -1 for unlimited, or the numeric limit.
   */
  static async getKeywordLimit(userId: string): Promise<number> {
    const { data: profile, error } = await supabaseServiceRole
      .from('indb_auth_user_profiles')
      .select('package:indb_payment_packages(quota_limits)')
      .eq('user_id', userId)
      .single();

    if (error || !profile) return 10; // default free limit

    const pkg = Array.isArray(profile.package) ? profile.package[0] : profile.package;
    const quotaLimits = pkg?.quota_limits as Record<string, number> | null;
    return quotaLimits?.max_keywords ?? 10;
  }
}
