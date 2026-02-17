/**
 * Error Statistics API Endpoint
 * Provides comprehensive error tracking statistics for admin dashboard
 * Updated for Phase 3: Shows ALL error types, not just rank-check errors
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { adminApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

interface ErrorCount {
    message: string;
    error_type: string;
    severity: string;
    count: number;
}

interface EndpointCount {
    endpoint: string;
    count: number;
}

interface StatsResult {
    summary: {
        totalErrors: number;
        criticalErrors: number;
        highErrors: number;
        unresolvedErrors: number;
    };
    distributions: {
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        byEndpoint: EndpointCount[];
    };
    topErrors: ErrorCount[];
    trend: {
        value: number;
        direction: 'up' | 'down' | 'stable';
        previousPeriodCount: number;
        currentPeriodCount: number;
    };
    timeRange: string;
}

/**
 * GET /api/v1/admin/errors/stats
 * Query Parameters:
 * - range: Time range (24h, 7d, 30d) - defaults to 24h
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    const { searchParams } = new URL(request.url);
    const endpoint = new URL(request.url).pathname;
    const timeRange = searchParams.get('range') || '24h';

    const stats = await SecureServiceRoleWrapper.executeSecureOperation<StatsResult>(
        {
            userId: adminUser.id,
            operation: 'fetch_error_statistics',
            reason: 'Admin viewing error dashboard statistics',
            source: endpoint,
            metadata: { timeRange }
        },
        {
            table: 'indb_system_error_logs',
            operationType: 'select',
            columns: ['*'],
            whereConditions: {}
        },
        async () => {
            const timeFilter = getTimeFilter(timeRange);
            const previousTimeFilter = getPreviousTimeFilter(timeRange);

            // Total errors in current period
            const { count: totalErrors, error: totalError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', timeFilter);
            if (totalError) throw totalError;

            // Critical errors in current period
            const { count: criticalErrors, error: criticalError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact', head: true })
                .eq('severity', 'CRITICAL')
                .gte('created_at', timeFilter);
            if (criticalError) throw criticalError;

            // High severity errors in current period
            const { count: highErrors, error: highError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact', head: true })
                .eq('severity', 'HIGH')
                .gte('created_at', timeFilter);
            if (highError) throw highError;

            // Unresolved errors in current period
            const { count: unresolvedErrors, error: unresolvedError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact', head: true })
                .is('resolved_at', null)
                .gte('created_at', timeFilter);
            if (unresolvedError) throw unresolvedError;

            // Errors by type distribution (SQL GROUP BY via RPC)
            const { data: typeDistributionData, error: typeError } = await (supabaseAdmin.rpc as Function)(
                'get_error_type_distribution', { p_since: timeFilter }
            );
            if (typeError) throw typeError;
            const typeDistribution: Record<string, number> = typeDistributionData || {};

            // Errors by severity distribution (SQL GROUP BY via RPC)
            const { data: severityDistributionData, error: severityError } = await (supabaseAdmin.rpc as Function)(
                'get_error_severity_distribution', { p_since: timeFilter }
            );
            if (severityError) throw severityError;
            const severityDistribution: Record<string, number> = severityDistributionData || {};

            // Most common errors (top 5 by message)
            const { data: commonErrors, error: commonError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('message, error_type, severity')
                .gte('created_at', timeFilter)
                .order('created_at', { ascending: false })
                .limit(200);
            if (commonError) throw commonError;

            // Group by message and count occurrences
            const errorCounts = (commonErrors || []).reduce((acc, error) => {
                const key = error.message;
                if (!acc[key]) {
                    acc[key] = {
                        message: error.message,
                        error_type: error.error_type,
                        severity: error.severity,
                        count: 0
                    };
                }
                acc[key].count++;
                return acc;
            }, {} as Record<string, ErrorCount>);

            const topErrors = Object.values(errorCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Error trend (compare with previous period)
            const { count: previousPeriodErrors, error: trendError } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', previousTimeFilter)
                .lt('created_at', timeFilter);
            if (trendError) throw trendError;

            // Calculate trend percentage
            const trend = previousPeriodErrors && previousPeriodErrors > 0
                ? (((totalErrors || 0) - previousPeriodErrors) / previousPeriodErrors) * 100
                : (totalErrors || 0) > 0 ? 100 : 0;

            // Most affected endpoints (top 5 via RPC GROUP BY)
            const { data: endpointRows, error: endpointError } = await (supabaseAdmin.rpc as Function)(
                'get_error_endpoint_distribution', { p_since: timeFilter, p_limit: 5 }
            );
            if (endpointError) throw endpointError;

            const topEndpoints: EndpointCount[] = (endpointRows || []).map(
                (row: { endpoint: string; count: number }) => ({ endpoint: row.endpoint, count: Number(row.count) })
            );

            return {
                summary: {
                    totalErrors: totalErrors || 0,
                    criticalErrors: criticalErrors || 0,
                    highErrors: highErrors || 0,
                    unresolvedErrors: unresolvedErrors || 0
                },
                distributions: {
                    byType: typeDistribution,
                    bySeverity: severityDistribution,
                    byEndpoint: topEndpoints
                },
                topErrors,
                trend: {
                    value: Math.round(trend * 10) / 10,
                    direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
                    previousPeriodCount: previousPeriodErrors || 0,
                    currentPeriodCount: totalErrors || 0
                },
                timeRange
            };
        }
    );

    return formatSuccess(stats);
});

function getTimeFilter(range: string): string {
    const now = new Date();
    switch (range) {
        case '24h':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        default:
            return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
}

function getPreviousTimeFilter(range: string): string {
    const now = new Date();
    switch (range) {
        case '24h':
            return new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
        case '7d':
            return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
        case '30d':
            return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
        default:
            return new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    }
}
