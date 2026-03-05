import { NextRequest } from 'next/server';
import { createAnonServerClient, SecureServiceRoleHelpers } from '@indexnow/database';
import { registerSchema, ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';
import { redisRateLimiter } from '@/lib/rate-limiting/redis-rate-limiter';

const REGISTER_RATE_LIMIT = { maxAttempts: 3, windowMs: 60 * 60 * 1000 };

/**
 * POST /api/v1/auth/register
 * User registration endpoint
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0].message,
        { severity: ErrorSeverity.LOW, statusCode: 400 }
      );
      return formatError(validationError);
    }

    // Check rate limit before processing registration
    const clientIP = getClientIP(request) || 'unknown';
    const rateLimit = await redisRateLimiter.check(`register_ip_${clientIP}`, REGISTER_RATE_LIMIT);
    if (!rateLimit.allowed) {
      const error = await ErrorHandlingService.createError(
        ErrorType.RATE_LIMIT,
        'Too many registration attempts. Please try again later.',
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 429,
          metadata: { retryAfter: rateLimit.retryAfter },
        }
      );
      return formatError(error);
    }

    const { name, email, password, phoneNumber, country } = validation.data;

    // Initialize server-side anon client (no browser localStorage dependency)
    const supabase = createAnonServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone_number: phoneNumber, country } },
    });

    if (error) {
      // Map Supabase error codes to user-friendly messages and appropriate error types
      const errorCode = error.code || 'unknown';
      let userMessageKey: string | undefined;
      let errorType = ErrorType.AUTHENTICATION;
      let statusCode = 400;

      if (errorCode === 'over_email_send_rate_limit') {
        errorType = ErrorType.RATE_LIMIT;
        userMessageKey = 'default'; // "Too many requests. Please wait before trying again."
        statusCode = 429;
      } else if (errorCode === 'user_already_exists' || error.message?.includes('already registered')) {
        userMessageKey = 'invalid_credentials';
      } else if (errorCode === 'weak_password') {
        errorType = ErrorType.VALIDATION;
        userMessageKey = 'default';
      }

      const authError = await ErrorHandlingService.createError(
        errorType,
        `Registration failed for ${email}: ${error.message}`,
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode,
          metadata: { email, errorCode, operation: 'user_registration' },
          userMessageKey,
        }
      );

      try {
        await ActivityLogger.logAuth(
          email,
          ActivityEventTypes.REGISTER,
          false,
          request,
          error.message
        );
      } catch (err) {
        logger.warn(
          { error: err instanceof Error ? err : undefined },
          'Failed to log registration activity'
        );
      }

      return formatError(authError);
    }

    // If user was created, create their profile row directly
    if (data.user?.id) {
      // Record successful registration for rate limiting
      await redisRateLimiter.increment(`register_ip_${clientIP}`, REGISTER_RATE_LIMIT);
      try {
        const operationContext = {
          userId: data.user.id,
          operation: 'registration_profile_create',
          reason: 'Create user profile after successful registration',
          source: 'auth/register',
          metadata: { hasPhoneNumber: !!phoneNumber, hasCountry: !!country, hasName: !!name },
          ipAddress: getClientIP(request) || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        };

        // Directly insert the profile row — no trigger dependency, no polling delay
        await SecureServiceRoleHelpers.secureInsert(
          operationContext,
          'indb_auth_user_profiles',
          {
            user_id: data.user.id,
            email: email.toLowerCase(),
            full_name: name?.toString().substring(0, 255) || null,
            phone_number: phoneNumber?.toString().replace(/[^\d+\-\s\(\)]/g, '') || null,
            country: country?.toString().substring(0, 100) || null,
          }
        );
      } catch (err) {
        logger.warn(
          { error: err instanceof Error ? err : undefined },
          'Failed to create user profile during registration'
        );
      }
    }

    // Log successful registration
    if (data.user?.id) {
      try {
        await ActivityLogger.logAuth(data.user.id, ActivityEventTypes.REGISTER, true, request);
      } catch (err) {
        logger.warn(
          { error: err instanceof Error ? err : undefined },
          'Failed to log registration completion activity'
        );
      }
    }

    // (#V7 M-17) Only return minimal user fields — never expose full auth user object
    return formatSuccess(
      {
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at,
            }
          : null,
        session: data.session,
        message: 'Registration successful. Please check your email to verify your account.',
      },
      undefined,
      201
    );
  } catch (error) {
    const systemError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.CRITICAL,
        statusCode: 500,
        metadata: { operation: 'user_registration' },
      }
    );
    return formatError(systemError);
  }
});
