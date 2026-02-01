import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for tracking failed attempts by IP
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [ip, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

interface RequestLike {
  headers: { get(name: string): string | null } | Headers;
  nextUrl?: { pathname: string };
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: RequestLike): string {
  const getHeader = (name: string): string | null => {
    if (typeof request.headers.get === 'function') {
      return request.headers.get(name);
    }
    return (request.headers as Record<string, string | undefined>)[name] || null;
  };

  const forwardedFor = getHeader('x-forwarded-for');
  const realIp = getHeader('x-real-ip');

  return (
    forwardedFor?.split(',')[0]?.trim() ||
    realIp ||
    'anonymous'
  );
}

/**
 * Check if IP is currently rate limited
 */
export function isRateLimited(request: RequestLike): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) return false;

  if (now > entry.resetTime) {
    rateLimitStore.delete(ip);
    return false;
  }

  return entry.count > MAX_ATTEMPTS;
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt(request: RequestLike): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  if (now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    logger.warn({
      ipAddress: ip,
      attemptCount: entry.count,
      maxAttempts: MAX_ATTEMPTS,
      userAgent: typeof request.headers.get === 'function' ? request.headers.get('user-agent') || 'unspecified' : 'unspecified',
      endpoint: request.nextUrl?.pathname || 'unspecified',
    }, 'Rate limit exceeded - potential brute force attack');

    return true;
  }

  return false;
}

/**
 * Reset rate limit for an IP
 */
export function resetRateLimit(request: RequestLike): void {
  const ip = getClientIp(request);
  rateLimitStore.delete(ip);
}
