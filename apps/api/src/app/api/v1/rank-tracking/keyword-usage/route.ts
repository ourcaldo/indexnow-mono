/**
 * Rank Tracking - Keyword Usage API
 * GET /api/v1/rank-tracking/keyword-usage
 * 
 * Returns the number of keywords tracked by the user and their plan limits
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, fromJson } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface PackageQuota {
    quota_limits: {
        keywords_limit: number;
        [key: string]: number | undefined;
    } | null;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const usageData = await SecureServiceRoleWrapper.executeWithUserSession(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_keyword_usage',
                source: 'rank-tracking/keyword-usage',
                reason: 'User checking keyword usage against quota',
                metadata: { endpoint: '/api/v1/rank-tracking/keyword-usage' },
                ipAddress: getClientIP(request) ?? undefined,
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_rank_keywords', operationType: 'select' },
            async (db) => {
                const [countResult, profileResult] = await Promise.all([
                    db.from('indb_rank_keywords')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', auth.userId),

                    db.from('indb_auth_user_profiles')
                        .select(`
                            package:indb_payment_packages(quota_limits)
                        `)
                        .eq('user_id', auth.userId)
                        .single()
                ]);

                return {
                    count: countResult.count || 0,
                    quota: profileResult.data?.package
                        ? fromJson<PackageQuota>(profileResult.data.package as any)?.quota_limits ?? null
                        : null
                };
            }
        ) as { count: number; quota: { keywords_limit: number; [key: string]: number | undefined } | null };

        const limit = usageData.quota?.keywords_limit || 10; // Default fallback
        const isUnlimited = limit === -1;

        return formatSuccess({
            used: usageData.count,
            limit: limit,
            remaining: isUnlimited ? -1 : Math.max(0, limit - usageData.count),
            is_unlimited: isUnlimited
        });

    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/rank-tracking/keyword-usage', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
