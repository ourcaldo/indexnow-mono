import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createAnonServerClient, createServerClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP, AppConfig } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { z } from 'zod';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

const RATE_LIMIT_IP = { maxAttempts: 30, windowMs: 15 * 60 * 1000 };

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

/**
 * POST /api/v1/auth/refresh
 * Refresh an expired access token using a refresh token.
 * Returns new access_token, refresh_token, and expires_at.
 * Also sets updated session cookies for cross-subdomain auth.
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parseResult = refreshSchema.safeParse(body);
    if (!parseResult.success) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, statusCode: 400 }
      );
      return formatError(error);
    }

    const { refresh_token } = parseResult.data;
    const clientIP = getClientIP(request) || '127.0.0.1';

    // Rate limit by IP (generous for auto-refresh)
    const ipCheck = await redisRateLimiter.check(`refresh_ip_${clientIP}`, RATE_LIMIT_IP);
    if (!ipCheck.allowed) {
      const error = await ErrorHandlingService.createError(
        ErrorType.RATE_LIMIT,
        'Too many refresh requests. Please try again later.',
        { severity: ErrorSeverity.LOW, statusCode: 429, metadata: { retryAfter: ipCheck.retryAfter } }
      );
      return formatError(error);
    }

    // Refresh the session via Supabase
    const supabase = createAnonServerClient();
    const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token });

    if (refreshError || !data.session) {
      const error = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        refreshError?.message || 'Failed to refresh session',
        { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
      );
      return formatError(error);
    }

    // Set updated session cookies for cross-subdomain auth
    const cookieStore = await cookies();
    const getBaseDomain = (): string => {
      try {
        return new URL(AppConfig.app.baseUrl).hostname;
      } catch {
        return '';
      }
    };

    const baseDomain = getBaseDomain();
    const cookieSupabase = createServerClient(
      cookieStore,
      baseDomain ? { domain: `.${baseDomain}` } : undefined
    );

    await cookieSupabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    return formatSuccess({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { severity: ErrorSeverity.HIGH, statusCode: 500 }
    );
    return formatError(structuredError);
  }
});
