/**
 * Rank Tracking - Weekly Trends API
 * GET /api/v1/rank-tracking/weekly-trends
 *
 * Returns weekly trend data (position deltas) for all user keywords.
 * All computation is done DB-side via get_user_weekly_trends RPC:
 *   - LATERAL join fetches 7-days-ago position per keyword in one pass
 *   - 7-day sparkline assembled in DB
 * Replaces the previous 2-query + 5k-row JS iteration approach.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const domain = request.nextUrl.searchParams.get('domain');

    const { data, error } = await (supabaseAdmin.rpc as Function)(
      'get_user_weekly_trends',
      { p_user_id: auth.userId, p_domain: domain || null }
    );

    if (error) throw error;

    return formatSuccess(data ?? []);
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/weekly-trends',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
