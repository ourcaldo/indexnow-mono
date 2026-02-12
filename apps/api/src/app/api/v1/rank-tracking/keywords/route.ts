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
  formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { type AuthenticatedRequest } from '@/lib/core/api-middleware';

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth: AuthenticatedRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const options = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    domain: searchParams.get('domain') || undefined,
    country: searchParams.get('country') || undefined,
    device: searchParams.get('device') || undefined,
    searchEngine: searchParams.get('searchEngine') || undefined,
    tags: searchParams.get('tags')?.split(',') || undefined,
    isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
    search: searchParams.get('search') || undefined,
  };

  const result = await rankTrackingService.getUserKeywords(auth.userId, options);
  return formatSuccess(result);
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth: AuthenticatedRequest) => {
  const body = await request.json();
  const { keyword, domain, country, device, searchEngine, targetUrl, tags } = body;

  if (!keyword || !domain || !country) {
    const validationError = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      'Missing required fields: keyword, domain, and country are required',
      { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
    );
    return formatError(validationError);
  }

  const result = await rankTrackingService.createKeyword(auth.userId, {
    keyword,
    domain,
    country,
    device,
    searchEngine,
    targetUrl,
    tags,
  });

  return formatSuccess(result);
});

export const DELETE = authenticatedApiWrapper(async (request: NextRequest, auth: AuthenticatedRequest) => {
  const body = await request.json();
  const { keywordIds } = body;

  if (!keywordIds || !Array.isArray(keywordIds)) {
    const validationError = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      'Invalid keywordIds: must be an array of keyword IDs',
      { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
    );
    return formatError(validationError);
  }

  const count = await rankTrackingService.deleteKeywords(keywordIds, auth.userId);
  return formatSuccess({ count });
});
