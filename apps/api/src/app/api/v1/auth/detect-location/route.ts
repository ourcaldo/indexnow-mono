import { NextRequest } from 'next/server';
import { getRequestInfo } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';
import { checkRouteRateLimit } from '@/lib/rate-limiting/route-rate-limit';

/**
 * GET /api/v1/auth/detect-location
 * Detect user location from IP address
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  const rateLimited = await checkRouteRateLimit(
    request,
    { maxAttempts: 10, windowMs: 60_000 },
    'detect_location'
  );
  if (rateLimited) return rateLimited;

  try {
    const requestInfo = await getRequestInfo(request);

    return formatSuccess({
      ip: requestInfo.ipAddress,
      country: requestInfo.locationData?.country || null,
      region: requestInfo.locationData?.region || null,
      city: requestInfo.locationData?.city || null,
    });
  } catch {
    /* Geo-detection unavailable */
    return formatSuccess({
      ip: null,
      country: null,
      countryCode: null,
      region: null,
      city: null,
    });
  }
});
