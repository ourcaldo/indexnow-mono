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
 * Safely get a header value from various header structures
 */
function getHeaderValue(headers: HeadersLike, name: string): string | null {
  // Check if it's a Headers object or similar with .get()
  if ('get' in headers && typeof (headers as any).get === 'function') {
    return (headers as any).get(name) ?? null;
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
