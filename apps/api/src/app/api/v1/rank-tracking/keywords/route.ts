/**
 * Rank Tracking - Keywords API
 * GET /api/v1/rank-tracking/keywords - List user's tracked keywords
 * POST /api/v1/rank-tracking/keywords - Create new keyword
 * DELETE /api/v1/rank-tracking/keywords - Bulk delete keywords
 */

import { NextRequest } from 'next/server';
import { RankTrackingService } from '@indexnow/services';
// (#V7 L-17) Module-level instantiation: Next.js caches route modules, so this service
// instance is shared across requests within the same Lambda/container lifetime.
// This is intentional for connection pooling and caching; the service is stateless.
const rankTrackingService = new RankTrackingService();
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { type AuthenticatedRequest } from '@/lib/core/api-middleware';
import { supabaseAdmin } from '@indexnow/database';
import { z } from 'zod';
import { enqueueJob } from '@/lib/queues/QueueManager';
import { queueConfig } from '@/lib/queues/config';
import { logger } from '@/lib/monitoring/error-handling';

// Frontend bulk-add format: domain_id + country_id (UUIDs), keywords array
const createKeywordsSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  domain_id: z.string().uuid(),
  country_id: z.string().uuid(),
  device_type: z.enum(['desktop', 'mobile']).optional().default('desktop'),
  tags: z.array(z.string()).optional(),
});

// Legacy single-keyword format (kept for backward compat)
const createKeywordSchema = z.object({
  keyword: z.string().min(1),
  domain: z.string().min(1),
  country: z.string().min(1),
  device: z.string().optional(),
  searchEngine: z.string().optional(),
  targetUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const deleteKeywordsSchema = z.object({
  keywordIds: z.array(z.string()).min(1),
});

export const GET = authenticatedApiWrapper(
  async (request: NextRequest, auth: AuthenticatedRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const options = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1') || 1),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10)),
      domain: searchParams.get('domain') || undefined,
      country: searchParams.get('country') || undefined,
      device: searchParams.get('device') || undefined,
      searchEngine: searchParams.get('searchEngine') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      isActive:
        searchParams.get('isActive') === 'true'
          ? true
          : searchParams.get('isActive') === 'false'
            ? false
            : undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await rankTrackingService.getUserKeywords(auth.userId, options);

    // Enrich flat country/domain strings into nested objects the frontend expects
    const keywords = (result.keywords ?? []) as Record<string, unknown>[];
    const keywordIds = keywords.map(k => k.id as string).filter(Boolean);

    // 1. Country map: iso2_code → { iso2_code, name }
    const countryCodes = Array.from(new Set(keywords.map(k => k.country as string).filter(Boolean)));
    let countryMap: Record<string, { iso2_code: string; name: string }> = {};
    if (countryCodes.length > 0) {
      const { data: countryRows } = await supabaseAdmin
        .from('indb_keyword_countries')
        .select('iso2_code, name')
        .in('iso2_code', countryCodes);
      countryMap = Object.fromEntries((countryRows ?? []).map(c => [c.iso2_code, c]));
    }

    // 2. Domain map: domain_name → { id, domain_name }
    const domainNames = Array.from(new Set(keywords.map(k => k.domain as string).filter(Boolean)));
    let domainMap: Record<string, { id: string; domain_name: string }> = {};
    if (domainNames.length > 0) {
      const { data: domainRows } = await supabaseAdmin
        .from('indb_keyword_domains')
        .select('id, domain_name')
        .in('domain_name', domainNames)
        .eq('user_id', auth.userId);
      domainMap = Object.fromEntries((domainRows ?? []).map(d => [d.domain_name, d]));
    }

    // 3. Recent rankings map: keyword_id → RankingEntry[]
    let rankingsMap: Record<string, { position: number | null; url: string | null; check_date: string }[]> = {};
    if (keywordIds.length > 0) {
      const { data: rankingRows } = await supabaseAdmin
        .from('indb_keyword_rankings')
        .select('keyword_id, position, url, check_date')
        .in('keyword_id', keywordIds)
        .order('check_date', { ascending: false })
        .limit(keywordIds.length * 30); // up to 30 entries per keyword
      for (const row of rankingRows ?? []) {
        if (!rankingsMap[row.keyword_id]) rankingsMap[row.keyword_id] = [];
        rankingsMap[row.keyword_id].push({ position: row.position, url: row.url, check_date: row.check_date });
      }
    }

    const enriched = keywords.map(k => {
      const domainName = k.domain as string;
      const domainRow = domainName ? domainMap[domainName] : null;
      return {
        ...k,
        current_position: k.position ?? null,
        country: k.country
          ? (countryMap[k.country as string] ?? { iso2_code: k.country, name: (k.country as string).toUpperCase() })
          : null,
        domain: domainRow
          ? { id: domainRow.id, domain_name: domainRow.domain_name, display_name: domainRow.domain_name }
          : domainName
            ? { domain_name: domainName, display_name: domainName }
            : null,
        recent_ranking: rankingsMap[k.id as string] ?? [],
      };
    });

    return formatSuccess({ keywords: enriched, total: result.total ?? 0 });
  }
);

export const POST = authenticatedApiWrapper(
  async (request: NextRequest, auth: AuthenticatedRequest) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return formatError(
        await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Invalid JSON body', {
          severity: ErrorSeverity.LOW,
          userId: auth.userId,
          statusCode: 400,
        })
      );
    }

    // ── Try bulk format (frontend sends domain_id + country_id + keywords[]) ──
    const bulkParse = createKeywordsSchema.safeParse(body);
    if (bulkParse.success) {
      const { keywords, domain_id, country_id, device_type, tags } = bulkParse.data;

      // Resolve domain name from domain_id (must belong to this user)
      const { data: domainRow, error: domainErr } = await supabaseAdmin
        .from('indb_keyword_domains')
        .select('domain_name')
        .eq('id', domain_id)
        .eq('user_id', auth.userId)
        .single();

      if (domainErr || !domainRow) {
        return formatError(
          await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Domain not found', {
            severity: ErrorSeverity.LOW,
            userId: auth.userId,
            statusCode: 400,
          })
        );
      }

      // Resolve country ISO2 code from country_id
      const { data: countryRow, error: countryErr } = await supabaseAdmin
        .from('indb_keyword_countries')
        .select('iso2_code')
        .eq('id', country_id)
        .single();

      if (countryErr || !countryRow) {
        return formatError(
          await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Country not found', {
            severity: ErrorSeverity.LOW,
            userId: auth.userId,
            statusCode: 400,
          })
        );
      }

      const results = [];
      const skipped: string[] = [];

      // Check for already-existing keywords for this user/domain/country/device combo
      const { data: existingRows } = await supabaseAdmin
        .from('indb_rank_keywords')
        .select('keyword')
        .eq('user_id', auth.userId)
        .eq('domain', domainRow.domain_name)
        .eq('country', countryRow.iso2_code)
        .eq('device', device_type)
        .in('keyword', keywords);

      const existingSet = new Set((existingRows ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase()));

      for (const kw of keywords) {
        if (existingSet.has(kw.toLowerCase())) {
          skipped.push(kw);
          continue;
        }
        const created = await rankTrackingService.createKeyword(auth.userId, {
          keyword: kw,
          domain: domainRow.domain_name,
          country: countryRow.iso2_code,
          device: device_type,
          tags,
        });
        results.push(created);
      }

      // Trigger immediate rank check for each newly created keyword
      for (const kw of results) {
        try {
          if (process.env.ENABLE_BULLMQ === 'true') {
            await enqueueJob(
              queueConfig.rankCheck.name,
              'immediate-rank-check',
              { keywordId: kw.id, userId: auth.userId, domainId: domain_id },
              { priority: 1 }
            );
          }
        } catch (enqueueErr) {
          logger.warn({ keywordId: kw.id, error: enqueueErr }, 'Failed to enqueue rank check — keyword saved but check skipped');
        }
      }

      return formatSuccess({ created: results.length, keywords: results, skipped }, undefined, 201);
    }

    // ── Fall back to legacy single-keyword format ──
    const parseResult = createKeywordSchema.safeParse(body);
    if (!parseResult.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }
    const { keyword, domain, country, device, targetUrl, tags } = parseResult.data;

    // (#V7 M-28) Cast is safe: Zod schema validates device before this point.
    const result = await rankTrackingService.createKeyword(auth.userId, {
      keyword,
      domain,
      country,
      device: device as 'desktop' | 'mobile' | undefined,
      targetUrl,
      tags,
    });

    // Trigger immediate rank check for the newly created keyword
    try {
      if (process.env.ENABLE_BULLMQ === 'true') {
        await enqueueJob(
          queueConfig.rankCheck.name,
          'immediate-rank-check',
          { keywordId: result.id, userId: auth.userId },
          { priority: 1 }
        );
      }
    } catch (enqueueErr) {
      logger.warn({ keywordId: result.id, error: enqueueErr }, 'Failed to enqueue rank check — keyword saved but check skipped');
    }

    return formatSuccess({ created: 1, keywords: [result] }, undefined, 201);
  }
);

export const DELETE = authenticatedApiWrapper(
  async (request: NextRequest, auth: AuthenticatedRequest) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return formatError(
        await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Invalid JSON body', {
          severity: ErrorSeverity.LOW,
          userId: auth.userId,
          statusCode: 400,
        })
      );
    }
    const parseResult = deleteKeywordsSchema.safeParse(body);
    if (!parseResult.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }
    const { keywordIds } = parseResult.data;

    const count = await rankTrackingService.deleteKeywords(keywordIds, auth.userId);
    return formatSuccess({ count });
  }
);
