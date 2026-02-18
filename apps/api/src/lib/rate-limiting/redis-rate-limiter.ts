/**
 * Redis-backed Rate Limiter Service
 *
 * Provides distributed rate limiting using Redis (ioredis).
 * Falls back to in-memory when Redis is unavailable.
 *
 * Usage:
 *   import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';
 *   const result = await redisRateLimiter.check('login_email_user@example.com', { maxAttempts: 5, windowMs: 900_000 });
 *   if (!result.allowed) return formatError(...);
 *   // on failure:
 *   await redisRateLimiter.increment('login_email_user@example.com', { windowMs: 900_000 });
 */

import Redis from 'ioredis';
import { logger } from '@/lib/monitoring/error-handling';

// ── Redis connection (shares env vars with BullMQ / redis-cache) ──

let _client: Redis | null = null;
let _redisAvailable = true;

function getRedisClient(): Redis | null {
  if (!_redisAvailable) return null;
  if (_client) return _client;

  try {
    const redisUrl = process.env.REDIS_URL;

    _client = redisUrl
      ? new Redis(redisUrl, { keyPrefix: 'rl:', lazyConnect: true, maxRetriesPerRequest: 2, enableOfflineQueue: false })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          username: process.env.REDIS_USER || undefined,
          keyPrefix: 'rl:',
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
        });

    _client.on('error', (err) => {
      logger.warn({ error: err.message }, '[RateLimiter] Redis connection error — falling back to in-memory');
      _redisAvailable = false;
    });

    _client.on('connect', () => {
      _redisAvailable = true;
      logger.info({}, '[RateLimiter] Redis connected');
    });

    return _client;
  } catch {
    _redisAvailable = false;
    return null;
  }
}

// ── In-memory fallback ──

const MAX_STORE_SIZE = 10_000;
const inMemoryStore = new Map<string, { count: number; resetTime: number; blocked?: boolean }>();

function cleanExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Periodic cleanup every 60 seconds
let _cleanupInterval: ReturnType<typeof setInterval> | null = null;
function ensureCleanup(): void {
  if (!_cleanupInterval) {
    _cleanupInterval = setInterval(cleanExpiredEntries, 60_000);
    // Allow process to exit
    if (_cleanupInterval && typeof _cleanupInterval === 'object' && 'unref' in _cleanupInterval) {
      (_cleanupInterval as NodeJS.Timeout).unref();
    }
  }
}

// ── Rate limiter config ──

export interface RateLimitConfig {
  /** Maximum attempts allowed in the window */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Optional: block duration in ms after limit exceeded (default: same as windowMs) */
  blockDurationMs?: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining attempts in the current window */
  remaining: number;
  /** Seconds until the window resets */
  retryAfter: number;
}

// ── Core operations ──

async function redisCheck(key: string, config: RateLimitConfig): Promise<RateLimitResult | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (!raw) {
      return { allowed: true, remaining: config.maxAttempts, retryAfter: 0 };
    }

    const entry: { count: number; resetTime: number; blocked?: boolean } = JSON.parse(raw);
    const now = Date.now();

    if (now > entry.resetTime) {
      await client.del(key);
      return { allowed: true, remaining: config.maxAttempts, retryAfter: 0 };
    }

    if (entry.blocked) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
    }

    if (entry.count >= config.maxAttempts) {
      return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
    }

    return { allowed: true, remaining: config.maxAttempts - entry.count, retryAfter: 0 };
  } catch {
    return null; // Fallback to in-memory
  }
}

async function redisIncrement(key: string, config: RateLimitConfig): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const ttlSeconds = Math.ceil(config.windowMs / 1000);
    const raw = await client.get(key);
    const now = Date.now();

    if (!raw || now > JSON.parse(raw).resetTime) {
      const entry = { count: 1, resetTime: now + config.windowMs };
      await client.setex(key, ttlSeconds, JSON.stringify(entry));
      return;
    }

    const entry: { count: number; resetTime: number; blocked?: boolean } = JSON.parse(raw);
    entry.count++;

    // If exceeded and block duration specified, block for extended period
    if (entry.count >= config.maxAttempts && config.blockDurationMs) {
      entry.blocked = true;
      entry.resetTime = now + config.blockDurationMs;
      const blockTtl = Math.ceil(config.blockDurationMs / 1000);
      await client.setex(key, blockTtl, JSON.stringify(entry));
    } else {
      const remainingTtl = Math.ceil((entry.resetTime - now) / 1000);
      await client.setex(key, Math.max(remainingTtl, 1), JSON.stringify(entry));
    }
  } catch (err) {
    logger.warn({ error: err instanceof Error ? err.message : String(err) }, '[RateLimiter] Redis increment failed');
  }
}

function memoryCheck(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    if (entry) inMemoryStore.delete(key);
    return { allowed: true, remaining: config.maxAttempts, retryAfter: 0 };
  }

  if (entry.blocked) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  if (entry.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  return { allowed: true, remaining: config.maxAttempts - entry.count, retryAfter: 0 };
}

function memoryIncrement(key: string, config: RateLimitConfig): void {
  ensureCleanup();
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Evict if over max store size
    if (inMemoryStore.size >= MAX_STORE_SIZE && !inMemoryStore.has(key)) {
      const firstKey = inMemoryStore.keys().next().value;
      if (firstKey) inMemoryStore.delete(firstKey);
    }
    inMemoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return;
  }

  entry.count++;
  if (entry.count >= config.maxAttempts && config.blockDurationMs) {
    entry.blocked = true;
    entry.resetTime = now + config.blockDurationMs;
  }
}

// ── Public API ──

export const redisRateLimiter = {
  /**
   * Check if a key is rate-limited. Does NOT increment the counter.
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const redisResult = await redisCheck(key, config);
    if (redisResult !== null) return redisResult;
    return memoryCheck(key, config);
  },

  /**
   * Increment the counter for a key (call after a failed attempt).
   */
  async increment(key: string, config: RateLimitConfig): Promise<void> {
    const client = getRedisClient();
    if (client) {
      await redisIncrement(key, config);
    } else {
      memoryIncrement(key, config);
    }
  },

  /**
   * Check + increment in one call. Returns the result BEFORE incrementing.
   * Use for "pre-check" style where every request counts as an attempt.
   */
  async checkAndIncrement(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const result = await this.check(key, config);
    if (result.allowed) {
      await this.increment(key, config);
    }
    return result;
  },

  /**
   * Delete a rate-limit key (e.g. after successful login).
   */
  async reset(key: string): Promise<void> {
    const client = getRedisClient();
    if (client) {
      try { await client.del(key); } catch { /* ignore */ }
    }
    inMemoryStore.delete(key);
  },

  /**
   * Check if Redis is available.
   */
  isRedisAvailable(): boolean {
    return _redisAvailable && _client !== null;
  },

  /**
   * Graceful shutdown.
   */
  async disconnect(): Promise<void> {
    if (_cleanupInterval) {
      clearInterval(_cleanupInterval);
      _cleanupInterval = null;
    }
    if (_client) {
      await _client.quit();
      _client = null;
    }
  },
};
