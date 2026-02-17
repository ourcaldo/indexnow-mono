import { NextRequest } from 'next/server';
import { createAnonServerClient } from '@indexnow/database';
import { loginSchema, getClientIP } from '@indexnow/shared';
import {
  publicApiWrapper,
  formatSuccess,
  formatError
} from '@/lib/core/api-response-middleware';
import {
  ErrorHandlingService,
  ErrorType,
  ErrorSeverity,
  logger
} from '@/lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';
import { loginNotificationService } from '@/lib/monitoring/login-notification-service';
import { getRequestInfo } from '@indexnow/shared';

// In-memory rate limit store for login attempts
// NOTE: In-memory store is per-process; use Redis for multi-instance deployments
const loginRateLimitStore = new Map<string, { count: number; resetTime: number }>();

const LOGIN_RATE_LIMIT = {
  MAX_ATTEMPTS_PER_EMAIL: 5,    // 5 failed attempts per email
  MAX_ATTEMPTS_PER_IP: 20,      // 20 attempts per IP (allows multiple users behind NAT)
  WINDOW_MS: 15 * 60 * 1000,    // 15-minute window
};

/**
 * Check rate limit for login requests
 */
function checkLoginRateLimit(email: string, clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const emailKey = `login_email_${email.toLowerCase()}`;
  const ipKey = `login_ip_${clientIP}`;

  // Clear expired entries
  for (const key of [emailKey, ipKey]) {
    const record = loginRateLimitStore.get(key);
    if (record && now > record.resetTime) {
      loginRateLimitStore.delete(key);
    }
  }

  const emailRecord = loginRateLimitStore.get(emailKey);
  const ipRecord = loginRateLimitStore.get(ipKey);

  // Check email limit
  if (emailRecord && emailRecord.count >= LOGIN_RATE_LIMIT.MAX_ATTEMPTS_PER_EMAIL) {
    const retryAfter = Math.ceil((emailRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Check IP limit
  if (ipRecord && ipRecord.count >= LOGIN_RATE_LIMIT.MAX_ATTEMPTS_PER_IP) {
    const retryAfter = Math.ceil((ipRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt for rate limiting
 */
function recordFailedLogin(email: string, clientIP: string): void {
  const now = Date.now();
  const emailKey = `login_email_${email.toLowerCase()}`;
  const ipKey = `login_ip_${clientIP}`;

  for (const key of [emailKey, ipKey]) {
    const record = loginRateLimitStore.get(key);
    if (record && now <= record.resetTime) {
      record.count++;
    } else {
      loginRateLimitStore.set(key, { count: 1, resetTime: now + LOGIN_RATE_LIMIT.WINDOW_MS });
    }
  }
}

/**
 * POST /api/v1/auth/login
 * Handles user authentication via Supabase and logs activity
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
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
          metadata: { errors: validationResult.error.errors }
        }
      );
      return formatError(error);
    }

    const { email, password } = validationResult.data;

    // 2. Check rate limit before attempting authentication
    const clientIP = getClientIP(request) || 'unknown';
    const rateLimit = checkLoginRateLimit(email, clientIP);
    if (!rateLimit.allowed) {
      const error = await ErrorHandlingService.createError(
        ErrorType.RATE_LIMIT,
        'Too many login attempts. Please try again later.',
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 429,
          metadata: { retryAfter: rateLimit.retryAfter }
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
      recordFailedLogin(email, clientIP);

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
          userMessageKey: 'invalid_credentials'
        }
      );
      return formatError(error);
    }

    const user = authData.user;

    // 5. Log successful login activity
    const requestInfo = await getRequestInfo(request);
    await ActivityLogger.logAuth(
      user.id,
      ActivityEventTypes.LOGIN,
      true,
      request
    );

    // 6. Send login notification email (async)
    loginNotificationService.sendLoginNotification({
      userId: user.id,
      userEmail: user.email!,
      userName: user.user_metadata?.full_name || user.email!.split('@')[0],
      ipAddress: requestInfo.ipAddress || 'Unknown',
      userAgent: requestInfo.userAgent || 'Unknown',
      deviceInfo: requestInfo.deviceInfo,
      locationData: requestInfo.locationData,
      loginTime: new Date().toISOString()
    }).catch(emailError => {
      logger.error({ error: emailError instanceof Error ? emailError : undefined }, 'Failed to send login notification email');
    });

    // 7. Return success response with session data
    return formatSuccess({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_sign_in_at: user.last_sign_in_at
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
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
        userMessageKey: 'default'
      }
    );
    return formatError(structuredError);
  }
});
