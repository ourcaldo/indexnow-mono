/**
 * Rank Tracking - Weekly Trends API
 * GET /api/v1/rank-tracking/weekly-trends
 *
 * Returns weekly trend data (changes in position) for all user keywords
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface WeeklyTrendsData {
  id: string;
  keyword: string;
  domain: string;
  current_position: number;
  previous_position: number; // 7 days ago
  change: number;
  url?: string;
  history?: { date: string; position: number }[];
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const trendsData = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'get_weekly_trends',
        source: 'rank-tracking/weekly-trends',
        reason: 'User viewing weekly keyword performance',
        metadata: { endpoint: '/api/v1/rank-tracking/weekly-trends' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
      { table: 'indb_rank_keywords', operationType: 'select' },
      async (db) => {
        // 1. Fetch all user keywords with current position
        const { data: keywords, error: kwError } = await db
          .from('indb_rank_keywords')
          .select('id, keyword, domain, position, last_checked')
          .eq('user_id', auth.userId)
          .eq('is_active', true)
          .limit(500);

        if (kwError) throw new Error(`Failed to fetch keywords: ${kwError.message}`);
        if (!keywords || keywords.length === 0) return [];

        const keywordIds = keywords.map((k) => k.id);

        // 2. Fetch history specifically for 7 days ago (approx)
        // We fetch last 8 days to find closest match if exactly 7 days missing
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
        const dateStr = eightDaysAgo.toISOString().split('T')[0];

        const { data: history, error: historyError } = await db
          .from('indb_keyword_rankings')
          .select('keyword_id, position, check_date')
          .in('keyword_id', keywordIds)
          .gte('check_date', dateStr)
          .order('check_date', { ascending: false })
          .limit(5000); // Newest first

        if (historyError) throw new Error(`Failed to fetch history: ${historyError.message}`);

        // 3. Calculate trends
        const result: WeeklyTrendsData[] = [];
        const historyMap = new Map<string, typeof history>();

        if (history) {
          history.forEach((h) => {
            const entries = historyMap.get(h.keyword_id) || [];
            entries.push(h);
            historyMap.set(h.keyword_id, entries);
          });
        }

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 7);
        const targetDateStr = targetDate.toISOString().split('T')[0]; // simple YYYY-MM-DD comp

        for (const kw of keywords) {
          const kwHistory = historyMap.get(kw.id) || [];

          // Find position closest to 7 days ago
          // Since specific date might be missing, we look for entry around that date
          // Or simply 'previous' position if we want simple change

          // Logic: Find entry with check_date <= targetDateStr (closest to it)
          // But kwHistory is sorted descending (newest first).
          // So we want the first entry that is <= targetDateStr?
          // Actually, let's just grab the entry that represents "start of week".

          const weekAgoEntry =
            kwHistory.find((h) => h.check_date <= targetDateStr) || kwHistory[kwHistory.length - 1];
          const previousPos = weekAgoEntry?.position || 0;
          const currentPos = kw.position || 0;

          // Rank change logic:
          // If current is 5, previous was 10. Change is +5 (improved).
          // If current is 10, previous was 5. Change is -5 (declined).
          // If unranked (0), treat differently? Assuming 0 = unranked.

          let change = 0;
          if (currentPos > 0 && previousPos > 0) {
            change = previousPos - currentPos;
          } else if (currentPos > 0 && previousPos === 0) {
            change = 100; // New entry (arbitrary positive)
          } else if (currentPos === 0 && previousPos > 0) {
            change = -100; // Lost ranking
          }

          // 7-day sparkline
          const sparkline = kwHistory
            .slice(0, 7)
            .map((h) => ({ date: h.check_date, position: h.position || 0 }))
            .reverse(); // Oldest to newest for graph

          result.push({
            id: kw.id,
            keyword: kw.keyword,
            domain: kw.domain || '',
            current_position: currentPos,
            previous_position: previousPos,
            change: change,
            history: sparkline,
          });
        }

        // Sort by biggest improvements? Or just created_at (which we didn't fetch)?
        // Let's sort by current rank (best first)
        return result.sort((a, b) => {
          if (a.current_position === 0) return 1;
          if (b.current_position === 0) return -1;
          return a.current_position - b.current_position;
        });
      }
    );

    return formatSuccess(trendsData || []);
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
