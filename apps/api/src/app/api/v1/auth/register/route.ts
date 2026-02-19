import { NextRequest } from 'next/server';
import { createAnonServerClient, SecureServiceRoleHelpers } from '@indexnow/database';
import { registerSchema, ErrorType, ErrorSeverity, getClientIP, sleep } from '@indexnow/shared';
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
      const authError = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        `Registration failed for ${email}: ${error.message}`,
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 400,
          metadata: { email, errorCode: error.code || 'unknown', operation: 'user_registration' },
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

    // If user was created, update their profile with additional data
    if (data.user?.id) {
      // Record successful registration for rate limiting
      await redisRateLimiter.increment(`register_ip_${clientIP}`, REGISTER_RATE_LIMIT);
      try {
        const operationContext = {
          userId: data.user.id,
          operation: 'registration_profile_update',
          reason: 'Complete user profile after successful registration',
          source: 'auth/register',
          metadata: { hasPhoneNumber: !!phoneNumber, hasCountry: !!country, hasName: !!name },
          ipAddress: getClientIP(request) || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        };

        // Wait for the user profile to be created by the database trigger
        // Poll with exponential backoff instead of fixed delay
        let profileReady = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          const delay = Math.min(500 * Math.pow(2, attempt), 4000); // 500ms, 1s, 2s, 4s, 4s
          await sleep(delay);

          try {
            const checkResults = await SecureServiceRoleHelpers.secureSelect(
              { ...operationContext, operation: 'registration_check_profile_exists' },
              'indb_auth_user_profiles',
              ['id'],
              { user_id: data.user.id }
            );

            if (Array.isArray(checkResults) && checkResults.length > 0) {
              profileReady = true;
              break;
            }
          } catch {
            /* Retry: profile not ready yet */
          }
        }

        // Update profile if it exists
        if (profileReady) {
          const updateData = {
            phone_number: phoneNumber?.toString().replace(/[^\d+\-\s\(\)]/g, '') || null,
            country: country?.toString().substring(0, 100) || null,
            full_name: name?.toString().substring(0, 255) || null,
          };

          await SecureServiceRoleHelpers.secureUpdate(
            operationContext,
            'indb_auth_user_profiles',
            updateData,
            { user_id: data.user.id }
          );
        }
      } catch (err) {
        logger.warn(
          { error: err instanceof Error ? err : undefined },
          'Failed to update user full_name during registration'
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
