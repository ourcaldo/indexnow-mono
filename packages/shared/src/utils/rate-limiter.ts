import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ⚠ SERVERLESS WARNING (#2/#3): This in-memory Map is per-isolate/per-process.
// In serverless/edge deployments (Vercel, Cloudflare Workers), each isolate has its own
// Map instance. Attackers can bypass rate limiting by hitting different instances.
// For production-grade rate limiting, replace with a distributed store:
//   - Upstash Redis (serverless-friendly): @upstash/ratelimit
//   - Redis + ioredis: sliding window counter
//   - Cloudflare KV / Durable Objects
// This implementation is suitable for single-process deployments only.
//
// MIGRATION PATH: The API app has a Redis cache service at
// apps/api/src/lib/cache/redis-cache.ts (cacheService.get/set with TTL).
// To migrate: inject a cache adapter via constructor or config function
// that calls cacheService.get/set for rate limit counters.

const MAX_STORE_SIZE = 10_000; // Cap to prevent unbounded memory growth (#4)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Clean up expired entries from the rate limit store.
 * Called lazily during rate limit checks instead of via periodic interval.
 * Also enforces MAX_STORE_SIZE to prevent unbounded memory growth (#4).
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [ip, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }

  // If still over limit after expiry cleanup, evict oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const sorted = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].resetTime - b[1].resetTime);
    const toRemove = sorted.slice(0, rateLimitStore.size - MAX_STORE_SIZE);
    for (const [ip] of toRemove) {
      rateLimitStore.delete(ip);
    }
  }
}

// Lazy cleanup: run every N checks instead of using setInterval
// (setInterval is unreliable in Edge/serverless runtimes)
let cleanupCounter = 0;
const CLEANUP_INTERVAL = 100; // every 100 rate-limit checks
function maybeCleanup(): void {
  cleanupCounter++;
  if (cleanupCounter >= CLEANUP_INTERVAL) {
    cleanupCounter = 0;
    cleanupExpiredEntries();
  }
}

// Type Definitions
export type HeaderValue = string | string[] | undefined | null;

export interface HeadersObject {
  [key: string]: HeaderValue;
}

export type HeadersLike =
  | Headers
  | HeadersObject
  | { get(name: string): string | null | undefined };

export interface RequestLike {
  headers: HeadersLike;
  nextUrl?: { pathname: string } | null;
}

/**
 * Type guard to check if the headers object has a .get() method
 */
function isHeadersWithGet(h: HeadersLike): h is { get(name: string): string | null } {
  return 'get' in h && typeof (h as Record<string, unknown>).get === 'function';
}

/**
 * Safely get a header value from various header structures
 */
function getHeaderValue(headers: HeadersLike, name: string): string | null {
  // Check if it's a Headers object or similar with .get()
  if (isHeadersWithGet(headers)) {
    return headers.get(name) ?? null;
  }

  // Treat as plain object (Record)
  const headersObj = headers as HeadersObject;
  // Try case-sensitive first, then lower-case
  const value = headersObj[name] || headersObj[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: RequestLike): string {
  const forwardedFor = getHeaderValue(request.headers, 'x-forwarded-for');
  const realIp = getHeaderValue(request.headers, 'x-real-ip');

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
  maybeCleanup();
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
  maybeCleanup();
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
      userAgent: getHeaderValue(request.headers, 'user-agent') || 'unspecified',
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
