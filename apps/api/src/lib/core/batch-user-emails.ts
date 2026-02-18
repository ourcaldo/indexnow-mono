import { supabaseAdmin } from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';

/**
 * Batch-fetch user emails by IDs using the `get_user_emails_by_ids` RPC function.
 * Falls back to parallel `getUserById` calls if the RPC is not available.
 *
 * Requires: `get_user_emails_by_ids` function from database-schema/database_schema.sql
 *
 * @returns Map of userId → email
 */
export async function batchGetUserEmails(userIds: string[]): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  if (userIds.length === 0) return emailMap;

  try {
    // Attempt batch RPC call (single SQL query)
    // @ts-expect-error - RPC 'get_user_emails_by_ids' not in generated Database types
    const { data, error } = await supabaseAdmin.rpc('get_user_emails_by_ids', {
      p_user_ids: userIds,
    });

    if (!error && data) {
      for (const row of data as unknown as { id: string; email: string }[]) {
        if (row.email) {
          emailMap.set(row.id, row.email);
        }
      }
      return emailMap;
    }

    // RPC not available — fall back to parallel individual calls
    logger.warn(
      { error: error?.message },
      'get_user_emails_by_ids RPC unavailable, falling back to individual lookups'
    );
  } catch (err) {
    logger.warn(
      { error: err instanceof Error ? err : undefined },
      'Batch email RPC fallback triggered'
    );
  }

  // Fallback: parallel getUserById (existing behavior)
  await Promise.all(
    userIds.map(async (uid) => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (data?.user?.email) {
          emailMap.set(uid, data.user.email);
        }
      } catch (e) {
        logger.warn(
          { userId: uid, error: e instanceof Error ? e.message : String(e) },
          'Failed to fetch email for user'
        );
      }
    })
  );

  return emailMap;
}
