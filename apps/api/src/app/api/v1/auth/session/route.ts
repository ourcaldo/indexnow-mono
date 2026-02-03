import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AppConfig } from '@indexnow/shared';
import { 
  publicApiWrapper, 
  formatSuccess, 
  formatError 
} from '../../../../../lib/core/api-response-middleware';
import { 
  ErrorHandlingService, 
  ErrorType, 
  ErrorSeverity 
} from '../../../../../lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '../../../../../lib/monitoring/activity-logger';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { loginNotificationService } from '../../../../../lib/email/login-notification-service';
import { getRequestInfo } from '../../../../../lib/utils/ip-device-utils';

/**
 * GET /api/v1/auth/session
 * Check if user has an active session via cookies
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  const endpoint = '/api/v1/auth/session';
  const method = 'GET';

  try {
    const sessionData = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system',
        operation: 'get_user_session',
        reason: 'Checking user session status',
        source: 'auth/session',
        metadata: { endpoint, method },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      },
      { table: 'auth.sessions', operationType: 'select' },
      async () => {
        const cookieStore = await cookies();
        
        const supabase = createServerClient(
          AppConfig.supabase.url,
          AppConfig.supabase.anonKey,
          {
            cookies: {
              getAll() { return cookieStore.getAll(); },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              },
            },
          }
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        return {
          hasSession: !!session,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role
          } : null
        };
      }
    );
    
    return formatSuccess(sessionData);
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.MEDIUM,
        endpoint,
        method,
        statusCode: 500,
        userMessageKey: 'default'
      }
    );
    return formatError(structuredError);
  }
});

/**
 * POST /api/v1/auth/session
 * Set or refresh session using access and refresh tokens
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  const endpoint = '/api/v1/auth/session';
  const method = 'POST';

  try {
    const { access_token, refresh_token } = await request.json();
    
    if (!access_token || !refresh_token) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Missing required tokens',
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 400,
          userMessageKey: 'missing_required'
        }
      );
      return formatError(error);
    }

    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const sessionResult = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system',
        operation: 'set_user_session',
        reason: 'Restoring user session from tokens',
        source: 'auth/session',
        metadata: { endpoint, method },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      },
      { table: 'auth.sessions', operationType: 'insert' },
      async () => {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        return { data, error };
      }
    );

    const { data, error: sessionError } = sessionResult;

    if (sessionError) {
      const error = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        `Failed to set session: ${sessionError.message}`,
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 401,
          userMessageKey: 'default'
        }
      );
      return formatError(error);
    }

    if (data.session?.user) {
      const user = data.session.user;
      
      // Log session established activity
      await ActivityLogger.logActivity({
        userId: user.id,
        eventType: 'session_established',
        actionDescription: 'User session established from tokens',
        request,
        success: true
      });

      // Send login notification (async)
      getRequestInfo(request).then(info => {
        loginNotificationService.sendLoginNotification({
          userId: user.id,
          userEmail: user.email!,
          userName: user.user_metadata?.full_name || user.email!.split('@')[0],
          ipAddress: info.ipAddress || 'Unknown',
          userAgent: info.userAgent || 'Unknown',
          deviceInfo: info.deviceInfo,
          locationData: info.locationData,
          loginTime: new Date().toISOString()
        }).catch(() => {});
      });
    }

    return formatSuccess({ success: true });

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

/**
 * DELETE /api/v1/auth/session
 * Logout and clear session cookies
 */
export const DELETE = publicApiWrapper(async (request: NextRequest) => {
  const endpoint = '/api/v1/auth/session';
  const method = 'DELETE';

  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, { ...options, maxAge: 0 });
            });
          },
        },
      }
    );

    await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system',
        operation: 'delete_user_session',
        reason: 'User logging out',
        source: 'auth/session',
        metadata: { endpoint, method },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      },
      { table: 'auth.sessions', operationType: 'delete' },
      async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    );

    return formatSuccess({ success: true });
  } catch (error) {
    // Return success anyway for logout
    return formatSuccess({ success: true });
  }
});
