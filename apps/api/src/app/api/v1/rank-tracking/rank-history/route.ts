/**
 * Rank Tracking - Rank History API
 * GET /api/v1/rank-tracking/rank-history
 * 
 * Returns historical ranking data for specific keywords
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface RankHistoryEntry {
    check_date: string;
    position: number;
    url?: string | null;
}

interface TransformedKeywordData {
    id: string;
    keyword: string;
    domain: string;
    country: string;
    device: string;
    history: RankHistoryEntry[];
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const searchParams = request.nextUrl.searchParams;
        const keywordIdsParam = searchParams.get('keywordIds');
        const parsedDays = parseInt(searchParams.get('days') || '30');
        const days = Number.isNaN(parsedDays) ? 30 : Math.min(90, Math.max(1, parsedDays));
        const parsedMaxResults = parseInt(searchParams.get('maxResults') || '5000');
        const maxResults = Number.isNaN(parsedMaxResults) ? 5000 : Math.min(10000, Math.max(100, parsedMaxResults));

        if (!keywordIdsParam) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'keywordIds parameter is required',
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const keywordIds = keywordIdsParam.split(',').filter(id => id.trim().length > 0);

        // Cap at 100 IDs to prevent unbounded queries
        if (keywordIds.length > 100) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Maximum 100 keyword IDs per request',
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }

        if (keywordIds.length === 0) {
            return formatSuccess([]);
        }

        const historyData = await SecureServiceRoleWrapper.executeWithUserSession(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_rank_history',
                source: 'rank-tracking/rank-history',
                reason: 'User fetching ranking history for keywords',
                metadata: { keywordCount: keywordIds.length },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_keyword_rankings', operationType: 'select' },
            async (db) => {
                // 1. Fetch keywords details
                const { data: keywords, error: kwError } = await db
                    .from('indb_rank_keywords')
                    .select('id, keyword, domain, country, device')
                    .in('id', keywordIds)
                    .eq('user_id', auth.userId)
                    .limit(100);

                if (kwError) throw new Error(`Failed to fetch keywords: ${kwError.message}`);
                if (!keywords || keywords.length === 0) return [];

                // 2. Fetch history for these keywords
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - days);
                const dateStr = daysAgo.toISOString().split('T')[0];

                const { data: history, error: historyError } = await db
                    .from('indb_keyword_rankings')
                    .select('keyword_id, position, check_date, url')
                    .in('keyword_id', keywordIds)
                    .gte('check_date', dateStr)
                    .order('check_date', { ascending: true })
                    .limit(maxResults);

                if (historyError) throw new Error(`Failed to fetch history: ${historyError.message}`);

                // 3. Merge data
                const result: TransformedKeywordData[] = [];

                for (const kw of keywords) {
                    const kwHistory = (history || [])
                        .filter(h => h.keyword_id === kw.id)
                        .map(h => ({
                            check_date: h.check_date,
                            position: h.position || 0,
                            url: h.url
                        }));

                    result.push({
                        id: kw.id,
                        keyword: kw.keyword,
                        domain: kw.domain || '',
                        country: kw.country || '',
                        device: kw.device || 'desktop',
                        history: kwHistory
                    });
                }

                return result;
            }
        );

        return formatSuccess(historyData || []);

    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/rank-tracking/rank-history', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
