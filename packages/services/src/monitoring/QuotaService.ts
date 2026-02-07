import { supabaseBrowser } from '@indexnow/database';

export class QuotaService {
  /**
   * Consume quota for a user using atomic RPC.
   * Returns true if successful, false if insufficient quota.
   */
  static async consumeQuota(userId: string, count: number): Promise<boolean> {
    const { data, error } = await supabaseBrowser.rpc('consume_user_quota', {
      target_user_id: userId,
      quota_amount: count
    });

    if (error) {
      console.error('Error consuming quota:', error);
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
        console.error('Error checking quota:', error);
        return false;
    }

    // -1 indicates unlimited quota
    if (profile.daily_quota_limit === -1) return true;

    return (profile.daily_quota_used + count) <= profile.daily_quota_limit;
  }
}
