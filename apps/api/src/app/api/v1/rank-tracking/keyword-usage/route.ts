/**
 * Rank Tracking - Keyword Usage API
 * GET /api/v1/rank-tracking/keyword-usage
 *
 * Returns the number of keywords tracked by the user and their plan limits
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, fromJson, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { buildOperationContext } from '@/lib/services/build-operation-context';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface PackageQuota {
  quota_limits: {
    max_keywords: number;
    max_domains?: number;
    [key: string]: number | undefined;
  } | null;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const usageData = (await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      buildOperationContext(request, auth.userId, {
        operation: 'get_keyword_usage',
        source: 'rank-tracking/keyword-usage',
        reason: 'User checking keyword usage against quota',
      }),
      { table: 'indb_rank_keywords', operationType: 'select' },
      async (db) => {
        // keyword-usage is account-wide (quota is per account, not per workspace)
        const [countResult, profileResult] = await Promise.all([
          db
            .from('indb_rank_keywords')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', auth.userId),

          db
            .from('indb_auth_user_profiles')
            .select(
              `
                            package:indb_payment_packages(quota_limits)
                        `
            )
            .eq('user_id', auth.userId)
            .single(),
        ]);

        return {
          count: countResult.count || 0,
          quota: profileResult.data?.package
            ? (fromJson<PackageQuota>(profileResult.data.package)
                ?.quota_limits ?? null)
            : null,
        };
      }
    )) as {
      count: number;
      quota: { max_keywords: number; [key: string]: number | undefined } | null;
    };

    if (usageData.quota?.max_keywords == null) {
      throw new Error('User package is missing max_keywords in quota_limits');
    }
    const limit = usageData.quota.max_keywords;
    const isUnlimited = limit === -1;

    return formatSuccess({
      used: usageData.count,
      limit: limit,
      remaining: isUnlimited ? -1 : Math.max(0, limit - usageData.count),
      is_unlimited: isUnlimited,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/keyword-usage',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
