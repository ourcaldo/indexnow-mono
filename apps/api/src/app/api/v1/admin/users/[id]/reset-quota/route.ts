import { NextRequest } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';

/**
 * POST /api/v1/admin/users/[id]/reset-quota
 *
 * Legacy endpoint — quota is now account-level (max_keywords, max_domains)
 * defined by the user's package. There are no daily counters to reset.
 * Kept as a no-op for API compatibility; returns a descriptive message.
 */
export const POST = adminApiWrapper(async (_request: NextRequest, _adminUser, context) => {
  const { id: userId } = (await context.params) as Record<string, string>;

  return formatSuccess(
    {
      message:
        'No action needed — quota is account-level and determined by the user\'s package. ' +
        'To change limits, change the user\'s package instead.',
      user_id: userId,
    },
    undefined,
    200
  );
});
