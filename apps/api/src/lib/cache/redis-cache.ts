/**
 * Redis Cache Service
 *
 * Provides a generic caching layer backed by Redis (ioredis).
 * Shares the same Redis connection config used by BullMQ.
 *
 * Usage:
 *   import { cacheService } from '@/lib/cache/redis-cache';
 *   const data = await cacheService.getOrSet('user:123', () => fetchUser(123), 300);
 */

import Redis from 'ioredis';
import { logger } from '@/lib/monitoring/error-handling';

// ── Redis connection (reuses env vars from queue config) ──

let _client: Redis | null = null;

function getRedisClient(): Redis {
  if (_client) return _client;

  const redisUrl = process.env.REDIS_URL;

  _client = redisUrl
    ? new Redis(redisUrl, { keyPrefix: 'cache:', lazyConnect: true, maxRetriesPerRequest: 3 })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        username: process.env.REDIS_USER || undefined,
        keyPrefix: 'cache:',
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

  _client.on('error', (err) => {
    logger.error({ error: err.message }, '[RedisCache] Connection error');
  });

  _client.on('connect', () => {
    logger.info({}, '[RedisCache] Connected');
  });

  return _client;
}

// ── Cache service ──

export const cacheService = {
  /**
   * Get a value from cache.
   * Returns `null` if key doesn't exist or Redis is unavailable.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const raw = await client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        `[RedisCache] get failed for key="${key}"`
      );
      return null;
    }
  },

  /**
   * Set a value in cache.
   * @param key   Cache key (auto-prefixed with `cache:`)
   * @param value Serialisable value
   * @param ttl   Time-to-live in **seconds** (default 300 = 5 min)
   */
  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    try {
      const client = getRedisClient();
      const serialised = JSON.stringify(value);
      if (ttl > 0) {
        await client.setex(key, ttl, serialised);
      } else {
        await client.set(key, serialised);
      }
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        `[RedisCache] set failed for key="${key}"`
      );
    }
  },

  /**
   * Get-or-set pattern: returns cached value or invokes `factory`, caches result, and returns it.
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  },

  /**
   * Delete one or more keys.
   */
  async del(...keys: string[]): Promise<void> {
    try {
      const client = getRedisClient();
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        `[RedisCache] del failed`
      );
    }
  },

  /**
   * Delete all keys matching a pattern (e.g. `user:*`).
   * Uses SCAN to avoid blocking.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const client = getRedisClient();
      let cursor = '0';
      let deleted = 0;

      do {
        // NOTE: keyPrefix is prepended automatically by ioredis
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          // Keys returned by scan already have the prefix stripped by ioredis
          await client.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');

      return deleted;
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        `[RedisCache] invalidatePattern failed for "${pattern}"`
      );
      return 0;
    }
  },

  /**
   * Check if Redis is reachable.
   */
  async ping(): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      /* Redis not available */
      return false;
    }
  },

  /**
   * Gracefully close the Redis connection.
   */
  async disconnect(): Promise<void> {
    if (_client) {
      await _client.quit();
      _client = null;
    }
  },
};
