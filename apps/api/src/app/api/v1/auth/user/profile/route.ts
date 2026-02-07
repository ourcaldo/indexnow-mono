import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity, updateUserProfileSchema } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * GET /api/v1/auth/user/profile
 * Get current user profile
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
        const profile = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-profile-get',
                operation: 'get_user_profile',
                source: 'auth/user/profile',
                reason: 'User fetching their own profile',
                metadata: { endpoint: '/api/v1/auth/user/profile', method: 'GET' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'select' },
            async (userSupabase, startSession) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Helper to get profile
                const { data, error } = await userSupabase
                    .from('indb_auth_user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error) throw new Error(error.message);
                return { ...data, email: user.email };
            }
        );

        return formatSuccess(profile);
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
 * PATCH /api/v1/auth/user/profile
 * Update user profile
 */
export const PATCH = publicApiWrapper(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = updateUserProfileSchema.safeParse(body);
        if (!validationResult.success) {
            const error = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Invalid profile data',
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

        const updatedProfile = await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-profile-update',
                operation: 'update_user_profile',
                source: 'auth/user/profile',
                reason: 'User updating their profile',
                metadata: { endpoint: '/api/v1/auth/user/profile', method: 'PATCH' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'update' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                const { data, error } = await userSupabase
                    .from('indb_auth_user_profiles')
                    .update(validationResult.data)
                    .eq('user_id', user.id)
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                return data;
            }
        );

        return formatSuccess(updatedProfile);
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
        );
        return formatError(err);
    }
});
