import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity, updateUserSettingsSchema } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * GET /api/v1/auth/user/settings
 * Get current user settings
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() { } // Read-only for getting session
            },
        }
    );

    try {
        const settings = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-settings-get',
                operation: 'get_user_settings',
                source: 'auth/user/settings',
                reason: 'User fetching their own settings',
                metadata: { endpoint: '/api/v1/auth/user/settings', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_auth_user_settings', operationType: 'select' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Helper to get settings or create default if missing
                let { data, error } = await userSupabase
                    .from('indb_auth_user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    // Not found, return defaults or empty object (frontend handles defaults)
                    return {};
                } else if (error) {
                    throw new Error(error.message);
                }

                return data;
            }
        );

        return formatSuccess(settings);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.AUTHENTICATION,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 401 }
        );
        return formatError(err);
    }
});

/**
 * PATCH /api/v1/auth/user/settings
 * Update user settings
 */
export const PATCH = publicApiWrapper(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = updateUserSettingsSchema.safeParse(body);
        if (!validationResult.success) {
            const error = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Invalid settings data',
                {
                    severity: ErrorSeverity.LOW,
                    statusCode: 400,
                    metadata: { issues: validationResult.error.errors }
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
                    }
                },
            }
        );

        const updatedSettings = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-settings-update',
                operation: 'update_user_settings',
                source: 'auth/user/settings',
                reason: 'User updating their settings',
                metadata: { endpoint: '/api/v1/auth/user/settings', method: 'PATCH' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_auth_user_settings', operationType: 'update' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Upsert settings
                const { data, error } = await userSupabase
                    .from('indb_auth_user_settings')
                    .upsert({
                        user_id: user.id,
                        ...validationResult.data
                    })
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                return data;
            }
        );

        return formatSuccess(updatedSettings);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
        );
        return formatError(err);
    }
});
