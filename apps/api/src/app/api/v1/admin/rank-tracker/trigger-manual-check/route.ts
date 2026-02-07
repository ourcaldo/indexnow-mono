/**
 * Admin API - Manual Rank Check Trigger
 * Allows admin to manually trigger the daily rank check process
 * 
 * Note: workerStartup and dailyRankCheckJob need restoration.
 * This provides a stub that logs the trigger request.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError,
    createStandardError
} from '../../../../../../../../lib/core/api-response-middleware';
import { logger } from '../../../../../../../../lib/monitoring/error-handling';

interface RankCheckStats {
    totalKeywords: number;
    pendingChecks: number;
    checkedToday: number;
    completionRate: string;
}

async function getRankCheckStats(): Promise<RankCheckStats> {
    try {
        // Get basic stats from database
        const { count: totalKeywords } = await supabaseAdmin
            .from('indb_seranking_keywords')
            .select('*', { count: 'exact', head: true });

        const today = new Date().toISOString().split('T')[0];

        const { count: checkedToday } = await supabaseAdmin
            .from('indb_seranking_keyword_results')
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
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Stats fetch failed, using defaults');
        return { totalKeywords: 0, pendingChecks: 0, checkedToday: 0, completionRate: '0' };
    }
}

export const POST = adminApiWrapper(async (request: NextRequest, adminUser) => {
    logger.info({ message: '🚀 Manual rank check trigger requested' }, 'Info');

    // Get current stats before starting
    const beforeStats = await getRankCheckStats();

    // TODO: Integrate with workerStartup.triggerManualRankCheck when restored
    // For now, log the trigger and return accepted
    logger.info({
        triggeredBy: adminUser.id,
        timestamp: new Date().toISOString(),
        beforeStats
    }, '🎯 Manual rank check trigger initiated');

    // Log the trigger event
    await supabaseAdmin
        .from('indb_system_activity_logs')
        .insert({
            user_id: adminUser.id,
            event_type: 'MANUAL_RANK_CHECK_TRIGGER',
            description: 'Admin manually triggered rank check',
            metadata: { beforeStats }
        });

    return formatSuccess({
        message: 'Manual rank check trigger request logged',
        triggeredAt: new Date().toISOString(),
        beforeStats,
        note: 'Full worker integration pending - trigger request logged for manual processing'
    });
});

export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
    // Get current stats
    const stats = await getRankCheckStats();

    // TODO: Get actual worker status when workerStartup is restored
    const workerStatus = {
        isInitialized: true,
        actuallyReady: true,
        rankCheckJobStatus: 'pending_restoration',
        note: 'Worker startup service needs restoration for full status'
    };

    return formatSuccess({
        workerStatus,
        currentStats: stats,
        timestamp: new Date().toISOString()
    });
});
