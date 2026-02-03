import { NextRequest } from 'next/server';
import { rankTrackingService } from '@/lib/services';
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

/**
 * GET /api/v1/rank-tracking/keywords
 * Fetch user's tracked keywords with filtering and pagination
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
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

  const result = await rankTrackingService.getUserKeywords(auth.data.userId, options);

  return formatSuccess(result);
});

/**
 * POST /api/v1/rank-tracking/keywords
 * Create a new keyword for tracking
 */
export const POST = authenticatedApiWrapper(async (request, auth) => {
  const body = await request.json();
  const { keyword, domain, country, device, searchEngine, targetUrl, tags } = body;

  if (!keyword || !domain || !country) {
    return formatError({
      id: 'validation-error',
      type: ErrorType.VALIDATION,
      message: 'Missing required fields',
      severity: ErrorSeverity.LOW,
      timestamp: new Date(),
      statusCode: 400
    });
  }

  const result = await rankTrackingService.createKeyword(auth.data.userId, {
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

/**
 * DELETE /api/v1/rank-tracking/keywords
 * Bulk delete keywords
 */
export const DELETE = authenticatedApiWrapper(async (request, auth) => {
  const body = await request.json();
  const { keywordIds } = body;

  if (!keywordIds || !Array.isArray(keywordIds)) {
    return formatError({
      id: 'validation-error',
      type: ErrorType.VALIDATION,
      message: 'Invalid keywordIds',
      severity: ErrorSeverity.LOW,
      timestamp: new Date(),
      statusCode: 400
    });
  }

  const count = await rankTrackingService.deleteKeywords(keywordIds, auth.data.userId);

  return formatSuccess({ count });
});
