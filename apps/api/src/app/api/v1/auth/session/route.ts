import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
  publicApiWrapper,
  formatSuccess,
  formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { getRequestInfo } from '@/lib/utils/ip-device-utils';
import { loginNotificationService } from '@/lib/email/login-notification-service';

// Types for session operations
interface SessionData {
  hasSession: boolean;
  user: { id: string; email: string | undefined } | null;
}

interface SetSessionResult {
  data: { session: { user: { id: string; email: string | undefined; user_metadata?: { full_name?: string } } } | null };
  error: { message: string } | null;
}

/**
 * GET /api/v1/auth/session
 * Check if user has active session (public - no auth required)
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  const sessionData = await SecureServiceRoleWrapper.executeSecureOperation<SessionData>(
    {
      userId: 'system',
      operation: 'get_user_session',
      source: 'auth/session',
      reason: 'System checking user session status',
      metadata: {
        endpoint: '/api/v1/auth/session',
        method: 'GET'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    { table: 'auth.sessions', operationType: 'select' },
    async () => {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
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
          email: session.user.email
        } : null
      };
    }
  );

  return formatSuccess(sessionData);
});

/**
 * POST /api/v1/auth/session
 * Create/restore session from tokens (public - creates auth)
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Missing required tokens',
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 400,
          userMessageKey: 'missing_required'
        }
      );
      return formatError(error);
    }

    const cookieStore = await cookies();

    // Get base domain for cross-subdomain cookies
    const getBaseDomain = (): string => {
      try {
        return new URL(AppConfig.app.baseUrl).hostname;
      } catch {
        return '';
      }
    };

    const baseDomain = getBaseDomain();

    const supabase = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Add cross-subdomain support to Supabase cookies
              const cookieOptions = {
                ...options,
                ...(baseDomain && { domain: `.${baseDomain}` })
              };
              cookieStore.set(name, value, cookieOptions);
            });
          },
        },
      }
    );

    // Set session using secure wrapper (system operation - no existing session required)
    const sessionResult = await SecureServiceRoleWrapper.executeSecureOperation<SetSessionResult>(
      {
        userId: 'system',
        operation: 'set_user_session',
        reason: 'System restoring user session from stored tokens',
        source: 'auth/session',
        metadata: {
          endpoint: '/api/v1/auth/session',
          hasTokens: !!(access_token && refresh_token)
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      { table: 'auth.sessions', operationType: 'insert' },
      async () => {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        return {
          data: { session: data.session },
          error: error ? { message: error.message } : null
        };
      }
    );

    const { data, error } = sessionResult;

    if (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        `Failed to set session: ${error.message}`,
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 400,
          userMessageKey: 'default'
        }
      );
      return formatError(structuredError);
    }

    // Log session activity and send notification if user is available
    if (data.session?.user?.id) {
      try {
        await ActivityLogger.logActivity({
          userId: data.session.user.id,
          eventType: 'session_established',
          actionDescription: 'User session restored from stored tokens',
          request
        });

        // Send login notification email for session restoration (fire-and-forget)
        const requestInfo = await getRequestInfo(request);
        loginNotificationService.sendLoginNotification({
          userId: data.session.user.id,
          userEmail: data.session.user.email || '',
          userName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
          ipAddress: requestInfo.ipAddress || 'Unknown',
          userAgent: requestInfo.userAgent || 'Unknown',
          deviceInfo: requestInfo.deviceInfo,
          locationData: requestInfo.locationData,
          loginTime: new Date().toISOString()
        }).catch(() => {
          // Silent fail for notification errors
        });

      } catch {
        // Continue even if activity logging fails
      }
    }

    return formatSuccess({ success: true });

  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        userMessageKey: 'default'
      }
    );
    return formatError(structuredError);
  }
});

/**
 * DELETE /api/v1/auth/session
 * Delete session/logout (public - destroys auth)
 */
export const DELETE = publicApiWrapper(async (request: NextRequest) => {
  const cookieStore = await cookies();

  // Get base domain for cross-subdomain cookie clearing
  const getBaseDomain = (): string => {
    const envUrls = [
      AppConfig.app.dashboardUrl,
      AppConfig.app.backendUrl,
      AppConfig.app.apiBaseUrl,
      AppConfig.app.baseUrl
    ].filter(Boolean) as string[];

    for (const url of envUrls) {
      try {
        const urlHostname = new URL(url).hostname;
        const parts = urlHostname.split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
      } catch {
        // Continue to next URL
      }
    }

    return '';
  };

  const baseDomain = getBaseDomain();

  // Create Supabase client for logout
  const supabase = createServerClient(
    AppConfig.supabase.url,
    AppConfig.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Add cross-subdomain support for cookie clearing
            const cookieOptions = {
              ...options,
              maxAge: 0,
              ...(baseDomain && { domain: `.${baseDomain}` })
            };
            cookieStore.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  // Sign out from Supabase using secure wrapper (system operation)
  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'delete_user_session',
      reason: 'System deleting user session via logout',
      source: 'auth/session',
      metadata: {
        endpoint: '/api/v1/auth/session'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    },
    { table: 'auth.sessions', operationType: 'delete' },
    async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    }
  );

  return formatSuccess({ success: true });
});

