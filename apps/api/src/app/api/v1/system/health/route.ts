import { NextRequest } from 'next/server';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, getClientIP } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { cacheService } from '@/lib/cache/redis-cache';

interface ServiceStatus {
  status: 'connected' | 'disconnected' | 'degraded' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}

// Health check cache key and TTL — uses Redis via cacheService when available,
// falls back to in-memory for single-process deployments
const HEALTH_CACHE_KEY = 'system:health';
const HEALTH_CACHE_TTL_S = 15; // 15 seconds

/**
 * GET /api/v1/system/health
 * Comprehensive health check — database, Redis, queues, external services
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  // Return cached result if fresh (Redis-backed when available)
  const cached = await cacheService.get<unknown>(HEALTH_CACHE_KEY);
  if (cached) {
    return formatSuccess(cached);
  }

  const results: Record<string, ServiceStatus> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // ── 1. Database ──
  const dbStart = Date.now();
  try {
    const healthContext = {
      userId: 'system',
      operation: 'system_health_check',
      reason: 'System health check endpoint testing database connectivity',
      source: 'system/health',
      metadata: {
        endpoint: '/api/v1/system/health',
        method: 'GET',
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const healthCheck = await SecureServiceRoleWrapper.executeSecureOperation(
      healthContext,
      {
        table: 'indb_auth_user_profiles',
        operationType: 'select',
        columns: ['user_id'],
        whereConditions: {},
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id')
          .limit(1);

        if (error) throw new Error(error.message);
        return data;
      }
    );

    results.database = healthCheck
      ? { status: 'connected', latencyMs: Date.now() - dbStart }
      : { status: 'disconnected', latencyMs: Date.now() - dbStart, error: 'No data returned' };
  } catch (err) {
    results.database = {
      status: 'disconnected',
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : String(err),
    };
    overallStatus = 'unhealthy';
  }

  // ── 2. Redis ──
  const redisStart = Date.now();
  try {
    const pong = await cacheService.ping();
    results.redis = pong
      ? { status: 'connected', latencyMs: Date.now() - redisStart }
      : { status: 'disconnected', latencyMs: Date.now() - redisStart, error: 'PING failed' };
  } catch {
    /* Service unavailable */
    results.redis = {
      status: 'disconnected',
      latencyMs: Date.now() - redisStart,
      error: 'Redis unreachable',
    };
    // Redis is not strictly required — mark as degraded
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  // ── 3. BullMQ queues ──
  try {
    const bullmqEnabled = process.env.ENABLE_BULLMQ === 'true';
    if (bullmqEnabled) {
      results.queues = { status: results.redis.status === 'connected' ? 'connected' : 'degraded' };
    } else {
      results.queues = { status: 'unconfigured' };
    }
  } catch {
    /* Service unavailable */
    results.queues = { status: 'unconfigured' };
  }

  // ── 4. External services (config-presence check) ──
  results.paddle = process.env.PADDLE_API_KEY
    ? { status: 'connected' }
    : { status: 'unconfigured' };

  results.sentry = process.env.NEXT_PUBLIC_SENTRY_DSN
    ? { status: 'connected' }
    : { status: 'unconfigured' };

  // SE Ranking — only report if API key is configured
  results.seranking = process.env.SE_RANKING_API_KEY
    ? { status: 'connected' }
    : { status: 'unconfigured' };

  // ── Determine overall status ──
  if (results.database.status !== 'connected') {
    overallStatus = 'unhealthy';
  }

  // (#60) Health endpoint is intentionally public for infrastructure monitoring.
  // It only reports service status (connected/disconnected), not internal details.
  if (overallStatus === 'unhealthy') {
    const error = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      new Error('Health check failed: critical services unavailable'),
      {
        statusCode: 503,
        metadata: { endpoint: '/api/v1/system/health' },
      }
    );
    return formatError(error);
  }

  const responseData = {
    status: overallStatus,
    services: results,
    api_version: 'v1',
    timestamp: new Date().toISOString(),
    // (#V7 H-10) Removed environment and uptime to prevent attacker fingerprinting
  };

  // Cache the result in Redis (multi-instance safe)
  await cacheService.set(HEALTH_CACHE_KEY, responseData, HEALTH_CACHE_TTL_S);

  return formatSuccess(responseData);
});
