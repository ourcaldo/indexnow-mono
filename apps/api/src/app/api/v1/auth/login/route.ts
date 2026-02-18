import { NextRequest } from 'next/server';
import { createAnonServerClient } from '@indexnow/database';
import { loginSchema, getClientIP } from '@indexnow/shared';
import {
  publicApiWrapper,
  formatSuccess,
  formatError,
  type RouteContext,
} from '@/lib/core/api-response-middleware';
import {
  ErrorHandlingService,
  ErrorType,
  ErrorSeverity,
  logger,
} from '@/lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';
import { loginNotificationService } from '@/lib/monitoring/login-notification-service';
import { getRequestInfo } from '@indexnow/shared';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

const LOGIN_RATE_LIMIT = {
  email: { maxAttempts: 5, windowMs: 15 * 60 * 1000 } as const,
  ip: { maxAttempts: 20, windowMs: 15 * 60 * 1000 } as const,
};

/**
 * POST /api/v1/auth/login
 * Handles user authentication via Supabase and logs activity
 */
export const POST = publicApiWrapper<any>(async (request: NextRequest, _context: RouteContext) => {
  const endpoint = '/api/v1/auth/login';
  const method = 'POST';

  try {
    // 1. Validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid login credentials format',
        {
          severity: ErrorSeverity.LOW,
          endpoint,
          method,
          statusCode: 400,
          userMessageKey: 'invalid_format',
          metadata: { errors: validationResult.error.errors },
        }
      );
      return formatError(error);
    }

    const { email, password } = validationResult.data;

    // 2. Check rate limit before attempting authentication
    const clientIP = getClientIP(request) || 'unknown';
    const emailKey = `login_email_${email.toLowerCase()}`;
    const ipKey = `login_ip_${clientIP}`;
    const [emailCheck, ipCheck] = await Promise.all([
      redisRateLimiter.check(emailKey, LOGIN_RATE_LIMIT.email),
      redisRateLimiter.check(ipKey, LOGIN_RATE_LIMIT.ip),
    ]);
    if (!emailCheck.allowed || !ipCheck.allowed) {
      const retryAfter = Math.max(emailCheck.retryAfter, ipCheck.retryAfter);
      const error = await ErrorHandlingService.createError(
        ErrorType.RATE_LIMIT,
        'Too many login attempts. Please try again later.',
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 429,
          metadata: { retryAfter },
        }
      );
      return formatError(error);
    }

    // 3. Initialize Supabase client
    const supabase = createAnonServerClient();

    // 4. Attempt login with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Record failed attempt for rate limiting
      await Promise.all([
        redisRateLimiter.increment(`login_email_${email.toLowerCase()}`, LOGIN_RATE_LIMIT.email),
        redisRateLimiter.increment(`login_ip_${clientIP}`, LOGIN_RATE_LIMIT.ip),
      ]);

      // Log failed login attempt
      await ActivityLogger.logAuth(
        'anonymous',
        ActivityEventTypes.LOGIN,
        false,
        request,
        authError?.message || 'Invalid credentials'
      );

      const error = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        authError?.message || 'Invalid email or password',
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 401,
          userMessageKey: 'invalid_credentials',
        }
      );
      return formatError(error);
    }

    const user = authData.user;

    // 5. Check if user must change password (set by admin password reset)
    try {
      const profileResult = await supabase
        .from('indb_auth_user_profiles')
        .select('must_change_password')
        .eq('user_id', user.id)
        .single();
      const profile = profileResult.data as { must_change_password: boolean } | null;

      if (profile?.must_change_password) {
        return formatSuccess({
          user: { id: user.id, email: user.email },
          mustChangePassword: true,
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
          },
        });
      }
    } catch {
      /* Column may not exist yet */
    }

    // 6. Log successful login activity
    const requestInfo = await getRequestInfo(request);
    await ActivityLogger.logAuth(user.id, ActivityEventTypes.LOGIN, true, request);

    // 7. Send login notification email (async)
    loginNotificationService
      .sendLoginNotification({
        userId: user.id,
        userEmail: user.email!,
        userName: user.user_metadata?.full_name || user.email!.split('@')[0],
        ipAddress: requestInfo.ipAddress || 'Unknown',
        userAgent: requestInfo.userAgent || 'Unknown',
        deviceInfo: requestInfo.deviceInfo,
        locationData: requestInfo.locationData,
        loginTime: new Date().toISOString(),
      })
      .catch((emailError) => {
        logger.error(
          { error: emailError instanceof Error ? emailError : undefined },
          'Failed to send login notification email'
        );
      });

    // 8. Return success response with session data
    return formatSuccess({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_sign_in_at: user.last_sign_in_at,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        endpoint,
        method,
        statusCode: 500,
        userMessageKey: 'default',
      }
    );
    return formatError(structuredError);
  }
});
