/**
 * Rank Tracking - Rank History API
 * GET /api/v1/rank-tracking/rank-history
 *
 * Returns historical ranking data for the authenticated user's keywords.
 *
 * Query params (all optional):
 *   start_date  ISO date string, e.g. "2025-01-01"  (takes precedence over days)
 *   end_date    ISO date string, e.g. "2025-02-01"  (defaults to today)
 *   days        number 1-840; used when start_date is not provided (default 30)
 *   keywordIds  comma-separated UUIDs to filter to specific keywords
 *   page        page number (default 1)
 *   limit       keywords per page (default 100, max 200)
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const sp = request.nextUrl.searchParams;

    // Date range
    const today = isoToday();
    const rawEndDate = sp.get('end_date') || today;
    const endDate = rawEndDate > today ? today : rawEndDate;

    let startDate: string;
    if (sp.get('start_date')) {
      startDate = sp.get('start_date')!;
    } else {
      const parsedDays = parseInt(sp.get('days') || '30');
      const days = Number.isNaN(parsedDays) ? 30 : Math.min(840, Math.max(1, parsedDays));
      startDate = subtractDays(endDate, days);
    }

    // Optional keyword filter
    const kwParam = sp.get('keywordIds');
    let filterIds: string[] | null = null;
    if (kwParam) {
      const ids = kwParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.some((id) => !UUID_RE.test(id))) {
        return formatError(
          await ErrorHandlingService.createError(ErrorType.VALIDATION, 'All keywordIds must be valid UUIDs', {
            severity: ErrorSeverity.LOW,
            userId: auth.userId,
            statusCode: 400,
          })
        );
      }
      if (ids.length > 200) {
        return formatError(
          await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Maximum 200 keyword IDs per request', {
            severity: ErrorSeverity.LOW,
            userId: auth.userId,
            statusCode: 400,
          })
        );
      }
      filterIds = ids;
    }

    // Pagination
    const page = Math.max(1, parseInt(sp.get('page') || '1') || 1);
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '100') || 100));
    const offset = (page - 1) * limit;

    // 1. Fetch user keywords
    let kwQuery = supabaseAdmin
      .from('indb_rank_keywords')
      .select('id, keyword, domain, country, device', { count: 'exact' })
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (filterIds && filterIds.length > 0) {
      kwQuery = kwQuery.in('id', filterIds);
    }

    const { data: keywords, error: kwError, count: totalCount } = await kwQuery;

    if (kwError) throw new Error(`Failed to fetch keywords: ${kwError.message}`);
    if (!keywords || keywords.length === 0) {
      return formatSuccess({ keywords: [], total: 0, startDate, endDate });
    }

    const keywordIds = keywords.map((k) => k.id);

    // 2. Country name map
    const iso2Codes = Array.from(new Set(keywords.map((k) => k.country).filter(Boolean)));
    let countryNameMap: Record<string, string> = {};
    if (iso2Codes.length > 0) {
      const { data: countryRows } = await supabaseAdmin
        .from('indb_keyword_countries')
        .select('iso2_code, name')
        .in('iso2_code', iso2Codes as string[]);
      countryNameMap = Object.fromEntries((countryRows ?? []).map((c) => [c.iso2_code, c.name]));
    }

    // 3. Fetch rankings for the date range (chunked to avoid large IN clauses)
    const CHUNK = 100;
    const allRankings: { keyword_id: string; position: number | null; check_date: string; url: string | null }[] = [];

    for (let i = 0; i < keywordIds.length; i += CHUNK) {
      const chunk = keywordIds.slice(i, i + CHUNK);
      const { data: rows, error: rErr } = await supabaseAdmin
        .from('indb_keyword_rankings')
        .select('keyword_id, position, check_date, url')
        .in('keyword_id', chunk)
        .gte('check_date', startDate)
        .lte('check_date', endDate)
        .order('check_date', { ascending: true });

      if (rErr) throw new Error(`Failed to fetch rankings: ${rErr.message}`);
      if (rows) allRankings.push(...rows);
    }

    // 4. Group rankings into per-keyword history map
    const historyByKeyword: Record<string, {
      historyMap: Record<string, number>;
      latestUrl: string | null;
      latestCheck: string | null;
      currentPosition: number | null;
    }> = {};

    for (const row of allRankings) {
      if (!historyByKeyword[row.keyword_id]) {
        historyByKeyword[row.keyword_id] = {
          historyMap: {},
          latestUrl: null,
          latestCheck: null,
          currentPosition: null,
        };
      }
      const entry = historyByKeyword[row.keyword_id];
      if (row.position !== null) {
        entry.historyMap[row.check_date] = row.position;
        if (!entry.latestCheck || row.check_date > entry.latestCheck) {
          entry.latestCheck = row.check_date;
          entry.latestUrl = row.url ?? null;
          entry.currentPosition = row.position;
        }
      }
    }

    // 5. Build response
    const result = keywords.map((kw) => {
      const hist = historyByKeyword[kw.id];
      const startPos = hist?.historyMap[startDate] ?? null;
      const currentPos = hist?.currentPosition ?? null;
      let change: number | null = null;
      if (startPos !== null && currentPos !== null) {
        change = startPos - currentPos; // positive = improved (rank went down in number)
      }

      return {
        id: kw.id,
        keyword: kw.keyword,
        domain: kw.domain || '',
        country: kw.country || '',
        country_name: kw.country ? (countryNameMap[kw.country] ?? kw.country) : '',
        device: kw.device || 'desktop',
        current_position: currentPos,
        change,
        latest_url: hist?.latestUrl ?? null,
        latest_check: hist?.latestCheck ?? null,
        history: hist?.historyMap ?? {},
      };
    });

    return formatSuccess({
      keywords: result,
      total: totalCount ?? result.length,
      startDate,
      endDate,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/rank-history',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
