import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    publicApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * Helper to get base domain for cross-subdomain cookie clearing
 */
function getBaseDomain(): string {
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
}

// Type for logout result
interface LogoutResult {
    userId: string | undefined;
    error: Error | null;
}

/**
 * POST /api/v1/auth/logout
 * Logout endpoint - clears session and cookies
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
    try {
        const cookieStore = await cookies();
        const baseDomain = getBaseDomain();

        const supabase = createServerClient(
            AppConfig.supabase.url,
            AppConfig.supabase.anonKey,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
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

        const logoutResult = await SecureServiceRoleWrapper.executeWithUserSession<LogoutResult>(
            supabase,
            {
                userId: 'user-logout',
                operation: 'user_logout',
                reason: 'User logging out of application',
                source: 'auth/logout',
                metadata: { endpoint: '/api/v1/auth/logout' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
            },
            { table: 'auth.sessions', operationType: 'delete' },
            async (userSupabase) => {
                const { data: sessionData } = await userSupabase.auth.getSession();
                const userId = sessionData.session?.user?.id;
                const { error } = await userSupabase.auth.signOut();
                return { userId, error: error ? new Error(error.message) : null };
            }
        );

        const { userId, error } = logoutResult;

        if (error) {
            const logoutError = await ErrorHandlingService.createError(
                ErrorType.AUTHENTICATION,
                'Logout failed',
                { severity: ErrorSeverity.MEDIUM, statusCode: 400 }
            );
            return formatError(logoutError);
        }

        if (userId) {
            try {
                await ActivityLogger.logAuth(userId, ActivityEventTypes.LOGOUT, true, request);
            } catch {
                // Silently fail activity logging - logout should still succeed
            }
        }

        return formatSuccess({ message: 'Logged out successfully' });
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500, metadata: { operation: 'user_logout' } }
        );
        return formatError(systemError);
    }
});

