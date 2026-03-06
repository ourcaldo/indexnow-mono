import { logger } from './logger';
import { isValidIP } from './ip-device-utils';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ── Pluggable rate-limit store (defaults to in-memory, supports Redis) ──

/**
 * Interface for a distributed rate-limit store (e.g. Redis).
 * Implement this and register via `setRateLimitStore()` to replace the
 * default in-memory Map with a distributed backend.
 *
 * ⚠ (#V7 H-07): The default in-memory store only works within a single process.
 * In multi-instance deployments (e.g. multiple containers behind a load balancer),
 * each instance maintains its own Map, so rate limits are per-instance, not global.
 * Register a Redis-backed store at startup for correct cross-instance enforcement.
 */
export interface RateLimitStore {
  /** Get the current entry for a key, or null if not found / expired */
  get(key: string): Promise<RateLimitEntry | null>;
  /** Set or update the entry for a key */
  set(key: string, entry: RateLimitEntry): Promise<void>;
  /** Delete a key */
  delete(key: string): Promise<void>;
}

// Default in-memory store (suitable for single-process deployments)
const MAX_STORE_SIZE = 10_000; // Cap to prevent unbounded memory growth (#4)
const inMemoryStore = new Map<string, RateLimitEntry>();

const inMemoryRateLimitStore: RateLimitStore = {
  async get(key: string) {
    const entry = inMemoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.resetTime) {
      inMemoryStore.delete(key);
      return null;
    }
    return entry;
  },
  async set(key: string, entry: RateLimitEntry) {
    // Enforce max size
    if (inMemoryStore.size >= MAX_STORE_SIZE && !inMemoryStore.has(key)) {
      // Evict oldest entry
      const oldest = Array.from(inMemoryStore.entries()).sort(
        (a, b) => a[1].resetTime - b[1].resetTime
      )[0];
      if (oldest) inMemoryStore.delete(oldest[0]);
    }
    inMemoryStore.set(key, entry);
  },
  async delete(key: string) {
    inMemoryStore.delete(key);
  },
};

// Active store — can be swapped via setRateLimitStore()
let activeStore: RateLimitStore = inMemoryRateLimitStore;

/**
 * Register a distributed rate-limit store (e.g. Redis-backed).
 * Call this at app startup to replace the default in-memory store.
 *
 * Example with Redis cacheService:
 * ```ts
 * import { cacheService } from '@/lib/cache/redis-cache';
 * import { setRateLimitStore } from '@indexnow/shared';
 *
 * setRateLimitStore({
 *   async get(key) {
 *     return cacheService.get(`ratelimit:${key}`);
 *   },
 *   async set(key, entry) {
 *     const ttlSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000);
 *     await cacheService.set(`ratelimit:${key}`, entry, Math.max(ttlSeconds, 1));
 *   },
 *   async delete(key) {
 *     await cacheService.del(`ratelimit:${key}`);
 *   },
 * });
 * ```
 */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store;
  logger.info({}, '[RateLimiter] Distributed rate-limit store registered');
}

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// ── Rate limiter IP extraction configuration (#V7 H-17) ──

/**
 * Configuration for the rate limiter's IP extraction behaviour.
 */
export interface RateLimiterConfig {
  /**
   * Trust reverse-proxy headers (X-Forwarded-For, X-Real-IP) for client IP
   * extraction.
   *
   * - `false` (default): Proxy headers are ignored. All requests are keyed as
   *   `'anonymous'`, sharing a single rate-limit bucket. Secure against header
   *   spoofing but coarse — enable `trustProxy` once deployed behind a trusted
   *   reverse proxy.
   * - `true`: The leftmost IP in X-Forwarded-For (the original client address
   *   appended by the first trusted proxy) is used after format validation.
   *   Only enable when the app runs behind a trusted reverse proxy (nginx,
   *   Vercel, Cloudflare) that **overwrites or appends** to X-Forwarded-For
   *   on every inbound request.
   *
   * ⚠ When `trustProxy` is true, ensure your reverse proxy strips or
   *   overwrites any incoming X-Forwarded-For header from the client to
   *   prevent spoofing.
   */
  trustProxy: boolean;
}

const rateLimiterConfig: RateLimiterConfig = {
  trustProxy: false,
};

/**
 * Configure the rate limiter. Call at app startup before any rate-limit checks.
 *
 * ```ts
 * import { configureRateLimiter } from '@indexnow/shared';
 * configureRateLimiter({ trustProxy: true }); // behind nginx/Vercel/Cloudflare
 * ```
 */
export function configureRateLimiter(config: Partial<RateLimiterConfig>): void {
  Object.assign(rateLimiterConfig, config);
  logger.info({ trustProxy: rateLimiterConfig.trustProxy }, '[RateLimiter] Configuration updated');
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
 * Extract client IP from request headers with spoofing protection (#V7 H-17).
 *
 * When `trustProxy` is **false** (default), proxy headers are ignored and all
 * requests are keyed as `'anonymous'`. This prevents IP spoofing via forged
 * `X-Forwarded-For` / `X-Real-IP` headers.
 *
 * When `trustProxy` is **true**, the leftmost (client) IP from
 * `X-Forwarded-For` is used after IP-format validation. Only enable behind a
 * trusted reverse proxy that sanitises incoming forwarded headers.
 *
 * Exported for reuse by other rate-limiting utilities (e.g. route-rate-limit).
 */
export function extractClientIp(request: RequestLike): string {
  if (!rateLimiterConfig.trustProxy) {
    return 'anonymous';
  }

  // Trusted proxy path — extract and validate forwarded headers
  const forwardedFor = getHeaderValue(request.headers, 'x-forwarded-for');
  if (forwardedFor) {
    // Leftmost IP is the original client IP set by the first trusted proxy
    const candidate = forwardedFor.split(',')[0]?.trim();
    if (candidate && isValidIP(candidate)) {
      return candidate;
    }
    logger.warn(
      { forwardedFor },
      '[RateLimiter] Invalid IP format in X-Forwarded-For, ignoring header'
    );
  }

  const realIp = getHeaderValue(request.headers, 'x-real-ip');
  if (realIp) {
    const candidate = realIp.trim();
    if (isValidIP(candidate)) {
      return candidate;
    }
    logger.warn({ realIp }, '[RateLimiter] Invalid IP format in X-Real-IP, ignoring header');
  }

  return 'anonymous';
}

/**
 * Check if IP is currently rate limited
 */
export async function isRateLimited(request: RequestLike): Promise<boolean> {
  const ip = extractClientIp(request);
  const entry = await activeStore.get(ip);
  if (!entry) return false;
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Record a failed authentication attempt
 */
export async function recordFailedAttempt(request: RequestLike): Promise<boolean> {
  const ip = extractClientIp(request);
  const now = Date.now();
  const entry = await activeStore.get(ip);

  if (!entry) {
    await activeStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  entry.count++;
  await activeStore.set(ip, entry);

  if (entry.count > MAX_ATTEMPTS) {
    logger.warn(
      {
        ipAddress: ip,
        attemptCount: entry.count,
        maxAttempts: MAX_ATTEMPTS,
        userAgent: getHeaderValue(request.headers, 'user-agent') || 'unspecified',
        endpoint: request.nextUrl?.pathname || 'unspecified',
      },
      'Rate limit exceeded - potential brute force attack'
    );

    return true;
  }

  return false;
}

/**
 * Reset rate limit for an IP
 */
export async function resetRateLimit(request: RequestLike): Promise<void> {
  const ip = extractClientIp(request);
  await activeStore.delete(ip);
}
