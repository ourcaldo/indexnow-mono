import { NextRequest } from 'next/server';
import { createAnonServerClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP, AppConfig } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { z } from 'zod';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

const RATE_LIMIT_EMAIL = { maxAttempts: 3, windowMs: 15 * 60 * 1000 };
const RATE_LIMIT_IP = { maxAttempts: 10, windowMs: 15 * 60 * 1000 };

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/v1/auth/reset-password
 * Send password reset email to user.
 * Always returns success to prevent email enumeration.
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parseResult = resetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid email address',
        { severity: ErrorSeverity.LOW, statusCode: 400 }
      );
      return formatError(error);
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(request) || '127.0.0.1';

    // Rate limit by email and IP
    const [emailCheck, ipCheck] = await Promise.all([
      redisRateLimiter.check(`reset_pwd_email_${normalizedEmail}`, RATE_LIMIT_EMAIL),
      redisRateLimiter.check(`reset_pwd_ip_${clientIP}`, RATE_LIMIT_IP),
    ]);

    if (!emailCheck.allowed || !ipCheck.allowed) {
      const retryAfter = Math.max(emailCheck.retryAfter, ipCheck.retryAfter);
      const error = await ErrorHandlingService.createError(
        ErrorType.RATE_LIMIT,
        'Too many password reset requests. Please try again later.',
        { severity: ErrorSeverity.LOW, statusCode: 429, metadata: { retryAfter } }
      );
      return formatError(error);
    }

    // Send password reset email via Supabase
    const supabase = createAnonServerClient();
    const redirectTo = `${AppConfig.app.dashboardUrl || AppConfig.app.baseUrl}/auth/callback?next=/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (resetError) {
      // Log the error but still return success to prevent email enumeration
      logger.warn(
        { error: resetError, email: normalizedEmail },
        'Password reset email failed (may be non-existent email)'
      );
    }

    // Log activity
    try {
      await ActivityLogger.logActivity({
        userId: 'anonymous',
        eventType: 'password_reset_requested',
        actionDescription: `Password reset requested for ${normalizedEmail}`,
        targetType: 'user',
        request,
      });
    } catch {
      // Silent fail for activity logging
    }

    // Always return success to prevent email enumeration
    return formatSuccess({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { severity: ErrorSeverity.HIGH, statusCode: 500 }
    );
    return formatError(structuredError);
  }
});
