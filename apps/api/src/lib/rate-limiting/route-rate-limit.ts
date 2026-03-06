/**
 * Route-level Redis-backed rate limiting helper.
 *
 * Wraps the existing `redisRateLimiter` for easy use inside route handlers.
 *
 * Usage:
 *   const limited = await checkRouteRateLimit(request, { maxAttempts: 20, windowMs: 60_000 }, 'billing');
 *   if (limited) return limited;  // returns NextResponse 429
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisRateLimiter, type RateLimitConfig } from './redis-rate-limiter';
import { extractClientIp } from '@indexnow/shared';

/**
 * Check rate limit for the current request.
 * Returns `null` if allowed, or a 429 NextResponse if rate-limited.
 */
export async function checkRouteRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string
): Promise<NextResponse | null> {
  const ip = extractClientIp(request);

  const key = `route_${prefix}_${ip}`;
  const result = await redisRateLimiter.checkAndIncrement(key, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(config.maxAttempts),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      }
    );
  }

  return null;
}
