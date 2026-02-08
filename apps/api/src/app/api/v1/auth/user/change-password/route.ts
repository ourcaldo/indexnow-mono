import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

/**
 * POST /api/v1/auth/user/change-password
 * Change user password using admin API
 */
export const POST = authenticatedApiWrapper(async (request, auth) => {
    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Invalid password format. Password must be at least 8 characters.',
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const updateResult = await SecureServiceRoleWrapper.executeWithUserSession(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'change_user_password',
                source: 'auth/user/change-password',
                reason: 'User changing their own password for security',
                metadata: { endpoint: '/api/v1/auth/user/change-password', method: 'POST', securityEvent: true },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') ?? undefined
            },
            { table: 'auth.users', operationType: 'update' },
            async () => {
                // Use admin client to update password
                const { error } = await supabaseAdmin.auth.admin.updateUserById(
                    auth.userId,
                    { password: newPassword }
                );
                return { error };
            }
        );

        const { error: updateError } = updateResult;
        if (updateError) {
            const passwordError = await ErrorHandlingService.createError(
                ErrorType.AUTHENTICATION,
                'Failed to change password',
                { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 400 }
            );
            return formatError(passwordError);
        }

        return formatSuccess({ message: 'Password changed successfully' });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/auth/user/change-password', method: 'POST', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
