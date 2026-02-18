/**
 * Admin API - Manual Rank Check Trigger
 * Allows admin to manually trigger the daily rank check process
 * 
 * @stub POST handler logs trigger but does not invoke workerStartup (pending restoration).
 * @stub GET handler returns hardcoded worker status.
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper, type Json } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError,
    createStandardError
} from '@/lib/core/api-response-middleware';
import { logger } from '@/lib/monitoring/error-handling';

interface RankCheckStats {
    totalKeywords: number;
    pendingChecks: number;
    checkedToday: number;
    completionRate: string;
}

async function getRankCheckStats(requesterId: string): Promise<RankCheckStats> {
    try {
        const stats = await SecureServiceRoleWrapper.executeSecureOperation<RankCheckStats>(
            {
                userId: requesterId,
                operation: 'get_rank_check_stats',
                reason: 'Fetching rank check statistics for admin dashboard',
                source: 'admin/rank-tracker/trigger-manual-check',
            },
            {
                table: 'indb_rank_keywords',
                operationType: 'select',
                columns: ['*'],
            },
            async () => {
                const { count: totalKeywords } = await supabaseAdmin
                    .from('indb_rank_keywords')
                    .select('*', { count: 'exact', head: true });

                const today = new Date().toISOString().split('T')[0];

                const { count: checkedToday } = await supabaseAdmin
                    .from('indb_keyword_rankings')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today);

                const total = totalKeywords || 0;
                const checked = checkedToday || 0;
                const pending = Math.max(0, total - checked);
                const rate = total > 0 ? ((checked / total) * 100).toFixed(1) : '0';

                return {
                    totalKeywords: total,
                    pendingChecks: pending,
                    checkedToday: checked,
                    completionRate: rate
                };
            }
        );

        return stats;
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Stats fetch failed, using defaults');
        return { totalKeywords: 0, pendingChecks: 0, checkedToday: 0, completionRate: '0' };
    }
}

export const POST = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    logger.info({ message: '🚀 Manual rank check trigger requested' }, 'Info');

    // Get current stats before starting
    const beforeStats = await getRankCheckStats(adminUser.id);

    // STUB(M-13): Integrate with workerStartup.triggerManualRankCheck when restored
    logger.warn('STUB: Manual rank check trigger endpoint hit — worker integration pending');
    logger.info({
        triggeredBy: adminUser.id,
        timestamp: new Date().toISOString(),
        beforeStats
    }, '🎯 Manual rank check trigger initiated');

    // Log the trigger event
    await SecureServiceRoleWrapper.executeSecureOperation(
        {
            userId: adminUser.id,
            operation: 'admin_trigger_manual_rank_check',
            reason: 'Admin manually triggered rank check process',
            source: 'admin/rank-tracker/trigger-manual-check',
            metadata: {
                beforeStats: beforeStats as unknown as Json,
                endpoint: '/api/v1/admin/rank-tracker/trigger-manual-check'
            },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') || undefined
        },
        {
            table: 'indb_system_activity_logs',
            operationType: 'insert',
            data: {
                user_id: adminUser.id,
                event_type: 'MANUAL_RANK_CHECK_TRIGGER',
                description: 'Admin manually triggered rank check',
                metadata: { beforeStats: beforeStats as unknown as Json }
            }
        },
        async () => {
            await (supabaseAdmin as any)
                .from('indb_system_activity_logs')
                .insert({
                    user_id: adminUser.id,
                    event_type: 'MANUAL_RANK_CHECK_TRIGGER',
                    description: 'Admin manually triggered rank check',
                    metadata: { beforeStats }
                });

            return { success: true };
        }
    );

    return formatSuccess({
        message: 'Manual rank check trigger request logged',
        triggeredAt: new Date().toISOString(),
        beforeStats,
        note: 'Full worker integration pending - trigger request logged for manual processing'
    });
});

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    // Get current stats
    const stats = await getRankCheckStats(adminUser.id);

    // STUB(M-13): Get actual worker status when workerStartup is restored
    logger.warn('STUB: Rank check worker status endpoint hit — returning hardcoded status');
    const workerStatus = {
        isInitialized: false,
        actuallyReady: false,
        rankCheckJobStatus: 'pending_restoration',
        note: 'Worker startup service pending restoration'
    };

    return formatSuccess({
        workerStatus,
        currentStats: stats,
        timestamp: new Date().toISOString()
    });
});
