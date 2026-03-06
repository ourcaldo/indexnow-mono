/**
 * Rank Tracking - Keywords API
 * GET /api/v1/rank-tracking/keywords - List user's tracked keywords
 * POST /api/v1/rank-tracking/keywords - Create new keyword
 * DELETE /api/v1/rank-tracking/keywords - Bulk delete keywords
 */

import { NextRequest } from 'next/server';
import { RankTrackingService, QuotaService } from '@indexnow/services';
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
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
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
    const keywordIds = keywords.map((k) => k.id as string).filter(Boolean);

    // 1. Country map: country_id (UUID) → { id, iso2_code, name }
    const countryIds = Array.from(
      new Set(keywords.map((k) => k.country_id as string).filter(Boolean))
    );
    let countryMap: Record<string, { id: string; iso2_code: string; name: string }> = {};
    if (countryIds.length > 0) {
      const { data: countryRows } = await supabaseAdmin
        .from('indb_keyword_countries')
        .select('id, iso2_code, name')
        .in('id', countryIds);
      countryMap = Object.fromEntries((countryRows ?? []).map((c) => [c.id, c]));
    }

    // 2. Domain map: domain_name → { id, domain_name }
    const domainNames = Array.from(
      new Set(keywords.map((k) => k.domain as string).filter(Boolean))
    );
    let domainMap: Record<string, { id: string; domain_name: string }> = {};
    if (domainNames.length > 0) {
      const { data: domainRows } = await supabaseAdmin
        .from('indb_keyword_domains')
        .select('id, domain_name')
        .in('domain_name', domainNames)
        .eq('user_id', auth.userId);
      domainMap = Object.fromEntries((domainRows ?? []).map((d) => [d.domain_name, d]));
    }

    // 3. Recent rankings map: keyword_id → RankingEntry[]
    let rankingsMap: Record<
      string,
      { position: number | null; url: string | null; check_date: string }[]
    > = {};
    if (keywordIds.length > 0) {
      const { data: rankingRows } = await supabaseAdmin
        .from('indb_keyword_rankings')
        .select('keyword_id, position, url, check_date')
        .in('keyword_id', keywordIds)
        .order('check_date', { ascending: false })
        .limit(keywordIds.length * 30); // up to 30 entries per keyword
      for (const row of rankingRows ?? []) {
        if (!rankingsMap[row.keyword_id]) rankingsMap[row.keyword_id] = [];
        rankingsMap[row.keyword_id].push({
          position: row.position,
          url: row.url,
          check_date: row.check_date,
        });
      }
    }

    // 4. Keyword bank enrichment: keyword_bank_id → enrichment data (volume, intent, difficulty, competition, cpc)
    const bankIds = Array.from(
      new Set(keywords.map((k) => k.keyword_bank_id as string).filter(Boolean))
    );
    let bankMap: Record<
      string,
      {
        search_volume: number | null;
        keyword_intent: string | null;
        keyword_difficulty: number | null;
        keyword_competition: number | null;
        cpc: number | null;
      }
    > = {};
    if (bankIds.length > 0) {
      const { data: bankRows } = await supabaseAdmin
        .from('indb_keyword_bank')
        .select('id, search_volume, keyword_intent, keyword_difficulty, keyword_competition, cpc')
        .in('id', bankIds);
      bankMap = Object.fromEntries(
        (bankRows ?? []).map((b) => [
          b.id,
          {
            search_volume: b.search_volume,
            keyword_intent: b.keyword_intent,
            keyword_difficulty: b.keyword_difficulty,
            keyword_competition: b.keyword_competition,
            cpc: b.cpc,
          },
        ])
      );
    }

    const enriched = keywords.map((k) => {
      const domainName = k.domain as string;
      const domainRow = domainName ? domainMap[domainName] : null;
      const bank = (k.keyword_bank_id as string) ? bankMap[k.keyword_bank_id as string] : null;
      return {
        ...k,
        current_position: k.position ?? null,
        country: k.country_id
          ? (countryMap[k.country_id as string] ?? { id: k.country_id, iso2_code: '', name: '' })
          : null,
        domain: domainRow
          ? {
              id: domainRow.id,
              domain_name: domainRow.domain_name,
              display_name: domainRow.domain_name,
            }
          : domainName
            ? { domain_name: domainName, display_name: domainName }
            : null,
        recent_ranking: rankingsMap[k.id as string] ?? [],
        // Enrichment data from keyword bank
        search_volume: bank?.search_volume ?? null,
        keyword_intent: bank?.keyword_intent ?? null,
        keyword_difficulty: bank?.keyword_difficulty ?? null,
        keyword_competition: bank?.keyword_competition ?? null,
        cpc: bank?.cpc ?? null,
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

      const results = [];
      const skipped: string[] = [];

      // Check for already-existing keywords for this user/domain/country/device combo
      const { data: existingRows } = await supabaseAdmin
        .from('indb_rank_keywords')
        .select('keyword')
        .eq('user_id', auth.userId)
        .eq('domain', domainRow.domain_name)
        .eq('country_id', country_id)
        .eq('device', device_type)
        .in('keyword', keywords);

      const existingSet = new Set(
        (existingRows ?? []).map((r: { keyword: string }) => r.keyword.toLowerCase())
      );

      // Calculate net new keywords and pre-check quota for entire batch
      const newKeywords = keywords.filter((kw) => !existingSet.has(kw.toLowerCase()));
      if (newKeywords.length > 0) {
        const canAdd = await QuotaService.canAddKeyword(auth.userId, newKeywords.length);
        if (!canAdd) {
          return formatError(
            await ErrorHandlingService.createError(
              ErrorType.VALIDATION,
              'Keyword limit reached for your current plan',
              { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 403 }
            )
          );
        }
      }

      for (const kw of keywords) {
        if (existingSet.has(kw.toLowerCase())) {
          skipped.push(kw);
          continue;
        }
        const created = await rankTrackingService.createKeyword(auth.userId, {
          keyword: kw,
          domain: domainRow.domain_name,
          country_id: country_id,
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
          logger.warn(
            { keywordId: kw.id, error: enqueueErr },
            'Failed to enqueue rank check — keyword saved but check skipped'
          );
        }
      }

      // Trigger immediate keyword enrichment for all newly created keywords
      if (results.length > 0 && process.env.ENABLE_BULLMQ === 'true') {
        try {
          await enqueueJob(
            queueConfig.keywordEnrichment.name,
            'immediate-keyword-enrichment',
            {
              scheduledAt: new Date().toISOString(),
              mode: 'immediate',
              keywordIds: results.map((kw) => kw.id),
              userId: auth.userId,
            },
            { priority: 1 }
          );
        } catch (enqueueErr) {
          logger.warn(
            { count: results.length, error: enqueueErr },
            'Failed to enqueue keyword enrichment — keywords saved but enrichment deferred to hourly sweep'
          );
        }
      }

      try {
        await ActivityLogger.logActivity({
          userId: auth.userId,
          eventType: 'keyword_create',
          actionDescription: `Added ${results.length} keyword(s)`,
          targetType: 'keyword',
          request,
          metadata: { count: results.length, skipped, domainId: domain_id },
        });
      } catch (logErr) {
        logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
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

    // Resolve legacy country ISO2 code → UUID FK
    const { data: legacyCountryRow } = await supabaseAdmin
      .from('indb_keyword_countries')
      .select('id')
      .eq('iso2_code', country.toUpperCase())
      .single();
    const resolvedCountryId = legacyCountryRow?.id ?? '';

    // (#V7 M-28) Cast is safe: Zod schema validates device before this point.
    const result = await rankTrackingService.createKeyword(auth.userId, {
      keyword,
      domain,
      country_id: resolvedCountryId,
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
      logger.warn(
        { keywordId: result.id, error: enqueueErr },
        'Failed to enqueue rank check — keyword saved but check skipped'
      );
    }

    // Trigger immediate keyword enrichment for the newly created keyword
    try {
      if (process.env.ENABLE_BULLMQ === 'true') {
        await enqueueJob(
          queueConfig.keywordEnrichment.name,
          'immediate-keyword-enrichment',
          {
            scheduledAt: new Date().toISOString(),
            mode: 'immediate',
            keywordIds: [result.id],
            userId: auth.userId,
          },
          { priority: 1 }
        );
      }
    } catch (enqueueErr) {
      logger.warn(
        { keywordId: result.id, error: enqueueErr },
        'Failed to enqueue keyword enrichment — keyword saved but enrichment deferred to hourly sweep'
      );
    }

    try {
      await ActivityLogger.logActivity({
        userId: auth.userId,
        eventType: 'keyword_create',
        actionDescription: `Added keyword: ${keyword}`,
        targetType: 'keyword',
        targetId: result.id,
        request,
        metadata: { keyword, domain },
      });
    } catch (logErr) {
      logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
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

    try {
      await ActivityLogger.logActivity({
        userId: auth.userId,
        eventType: 'keyword_delete',
        actionDescription: `Deleted ${count} keyword(s)`,
        targetType: 'keyword',
        request,
        metadata: { count, keywordIds },
      });
    } catch (logErr) {
      logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
    }

    return formatSuccess({ count });
  }
);
