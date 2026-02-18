/**
 * QuotaService — Client-side quota management utility.
 *
 * NOTE (#43): This service uses `supabaseBrowser` (client-side anon-key client).
 * It is intentionally placed in the `services` package as an internal utility
 * consumed by `RankTrackingService`. It is NOT exported from the package barrel.
 *
 * For server-side quota operations, use the quota hooks in `@indexnow/ui`
 * (useQuotaValidation, useGlobalQuotaManager) or direct DB queries via
 * service-role client in API routes.
 */
import { typedSupabaseBrowser as supabaseBrowser } from '@indexnow/database/client';

import { logger } from '@indexnow/shared';

export class QuotaService {
  /**
   * Consume quota for a user using atomic RPC.
   * Returns true if successful, false if insufficient quota.
   */
  static async consumeQuota(userId: string, count: number): Promise<boolean> {
    const { data, error } = await supabaseBrowser.rpc('consume_user_quota', {
      target_user_id: userId,
      quota_amount: count,
    });

    if (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error consuming quota');
      // Fail closed: if error, assume quota consumption failed
      return false;
    }

    return !!data;
  }

  /**
   * Check if user has enough quota without consuming it.
   * This is a "soft" check for UI/pre-validation.
   * Always rely on consumeQuota() for the actual operation.
   */
  static async checkQuota(userId: string, count: number): Promise<boolean> {
    const { data: profile, error } = await supabaseBrowser
      .from('indb_auth_user_profiles')
      .select('daily_quota_used, daily_quota_limit')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error checking quota');
      return false;
    }

    // -1 indicates unlimited quota
    const p = profile as { daily_quota_used: number; daily_quota_limit: number };
    if (p.daily_quota_limit === -1) return true;

    return p.daily_quota_used + count <= p.daily_quota_limit;
  }
}
