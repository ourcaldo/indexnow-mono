import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, supabaseAdmin, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { checkRouteRateLimit } from '@/lib/rate-limiting/route-rate-limit';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * POST /api/v1/auth/user/change-password
 * Change user password using admin API
 */
export const POST = authenticatedApiWrapper(async (request, auth) => {
  // (#V7 H-12) Rate limit password changes — 5 attempts per minute
  const rateLimited = await checkRouteRateLimit(
    request as unknown as NextRequest,
    { maxAttempts: 5, windowMs: 60_000 },
    'change_password'
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }
    const { currentPassword, newPassword } = parseResult.data;

    // Verify current password using user's own session (not admin client)
    const { error: signInError } = await auth.supabase.auth.signInWithPassword({
      email: auth.user.email,
      password: currentPassword,
    });

    if (signInError) {
      const authError = await ErrorHandlingService.createError(
        ErrorType.AUTHENTICATION,
        'Current password is incorrect.',
        { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 401 }
      );
      return formatError(authError);
    }

    const updateResult = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'change_user_password',
        source: 'auth/user/change-password',
        reason: 'User changing their own password for security',
        metadata: {
          endpoint: '/api/v1/auth/user/change-password',
          method: 'POST',
          securityEvent: true,
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'auth.users', operationType: 'update' },
      async () => {
        // Use admin client to update password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
          password: newPassword,
        });
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
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/auth/user/change-password',
        method: 'POST',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
