/**
 * Rank Tracking - Keywords API
 * GET /api/v1/rank-tracking/keywords - List user's tracked keywords
 * POST /api/v1/rank-tracking/keywords - Create new keyword
 * DELETE /api/v1/rank-tracking/keywords - Bulk delete keywords
 */

import { NextRequest } from 'next/server';
import { RankTrackingService } from '@indexnow/services';
const rankTrackingService = new RankTrackingService();
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { type AuthenticatedRequest } from '@/lib/core/api-middleware';
import { z } from 'zod';

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
    return formatSuccess(result);
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
    const parseResult = createKeywordSchema.safeParse(body);
    if (!parseResult.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }
    const { keyword, domain, country, device, searchEngine, targetUrl, tags } = parseResult.data;

    // (#V7 M-28) Cast is safe: Zod schema `createKeywordSchema` validates device
    // as z.enum(['desktop', 'mobile']).optional() before this point.
    const result = await rankTrackingService.createKeyword(auth.userId, {
      keyword,
      domain,
      country,
      device: device as 'desktop' | 'mobile' | undefined,
      targetUrl,
      tags,
    });

    return formatSuccess(result, undefined, 201);
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
