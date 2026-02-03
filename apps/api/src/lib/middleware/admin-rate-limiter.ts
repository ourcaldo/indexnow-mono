/**
 * Admin Rate Limiter
 * 
 * Provides rate limiting for admin endpoints.
 * Currently uses in-memory storage, but designed for Redis migration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/error-handling';

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    record.count += 1;
    return record;
  }
}

// TODO: Implement RedisRateLimitStore using @upstash/redis or similar
// This interface allows swapping the store without changing the middleware logic
// class RedisRateLimitStore implements RateLimitStore { ... }

// Singleton instance - Use Redis store in production if available
const rateLimitStore: RateLimitStore = new MemoryRateLimitStore();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export async function adminRateLimiter(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const key = `admin_rate_limit:${ip}`;

  try {
    const { count, resetTime } = await rateLimitStore.increment(key, WINDOW_MS);

    const remaining = Math.max(0, MAX_REQUESTS - count);

    if (count > MAX_REQUESTS) {
      logger.warn({ ip, count, resetTime }, 'Admin rate limit exceeded');
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
        }
      });
    }

    return null; // Continue
  } catch (error) {
    logger.error({ error }, 'Rate limiter error');
    return null; // Fail open
  }
}
