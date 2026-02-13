import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { loginSchema, AppConfig } from '@indexnow/shared';
import {
  publicApiWrapper,
  formatSuccess,
  formatError
} from '../../../../../lib/core/api-response-middleware';
import {
  ErrorHandlingService,
  ErrorType,
  ErrorSeverity,
  logger
} from '../../../../../lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '../../../../../lib/monitoring/activity-logger';
import { loginNotificationService } from '../../../../../lib/monitoring/login-notification-service';
import { getRequestInfo } from '@indexnow/shared';

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

    // 2. Initialize Supabase client
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() { return []; },
          setAll() { },
        },
      }
    );

    // 3. Attempt login with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
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

    // 4. Log successful login activity
    const requestInfo = await getRequestInfo(request);
    await ActivityLogger.logAuth(
      user.id,
      ActivityEventTypes.LOGIN,
      true,
      request
    );

    // 5. Send login notification email (async)
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

    // 6. Return success response with session data
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
