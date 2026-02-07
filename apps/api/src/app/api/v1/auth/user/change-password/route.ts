import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { AppConfig, ErrorType, ErrorSeverity, changePasswordSchema } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

/**
 * POST /api/v1/auth/user/change-password
 * Change current user password
 */
export const POST = publicApiWrapper(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validate request body
        const validationResult = changePasswordSchema.safeParse(body);
        if (!validationResult.success) {
            const error = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Invalid password data',
                {
                    severity: ErrorSeverity.LOW,
                    statusCode: 400,
                    metadata: { issues: validationResult.error.errors }
                }
            );
            return formatError(error);
        }

        const { currentPassword, newPassword } = validationResult.data;

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

        // Verify current password first by attempting sign in?
        // Actually, Supabase update password usually doesn't require old password if authenticated, 
        // but for security we should verify it.
        // However, Supabase doesn't expose "check password" for current session easily without re-login.
        // Given we are authenticated, we can update. But best practice is to require current password confirmation.
        // We will attempt a sign-in with current credentials to verify "currentPassword".

        await SecureServiceRoleWrapper.executeWithUserSession(
            supabase,
            {
                userId: 'user-change-password',
                operation: 'change_user_password',
                source: 'auth/user/change-password',
                reason: 'User changing password',
                metadata: { endpoint: '/api/v1/auth/user/change-password', method: 'POST' },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'auth.users', operationType: 'update' },
            async (userSupabase) => {
                const { data: { user }, error: userError } = await userSupabase.auth.getUser();
                if (userError || !user) throw new Error('User not found');

                // Verify current password via re-authentication (signInWithPassword)
                // Note: userSupabase is authenticated with session token, but to check password we need to sign in again.
                // But we don't have the user's email easily available unless we got it from getUser().

                const { error: signInError } = await userSupabase.auth.signInWithPassword({
                    email: user.email!,
                    password: currentPassword
                });

                if (signInError) {
                    throw new Error('Incorrect current password');
                }

                // Update password
                const { error: updateError } = await userSupabase.auth.updateUser({
                    password: newPassword
                });

                if (updateError) throw new Error(updateError.message);

                return { success: true };
            }
        );

        return formatSuccess({ message: 'Password changed successfully' });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isAuthError = errorMsg.includes('Incorrect current password') || errorMsg.includes('User not found');

        const err = await ErrorHandlingService.createError(
            isAuthError ? ErrorType.AUTHENTICATION : ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.MEDIUM, statusCode: isAuthError ? 401 : 500 }
        );
        return formatError(err);
    }
});
