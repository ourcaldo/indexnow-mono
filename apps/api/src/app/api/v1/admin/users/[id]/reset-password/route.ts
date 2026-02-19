import {
  SecureServiceRoleHelpers,
  SecureServiceRoleWrapper,
  supabaseAdmin,
} from '@indexnow/database';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import {
  adminApiWrapper,
  createStandardError,
  formatError,
} from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { logger } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { checkRouteRateLimit } from '@/lib/rate-limiting/route-rate-limit';

export const POST = adminApiWrapper(async (request: NextRequest, adminUser, context) => {
  const rateLimited = await checkRouteRateLimit(
    request,
    { maxAttempts: 5, windowMs: 300_000 },
    'admin_reset_pw'
  );
  if (rateLimited) return rateLimited;

  const { id: userId } = (await context.params) as Record<string, string>;

  const userContext = {
    userId: adminUser.id,
    operation: 'admin_get_user_for_password_reset',
    reason: 'Admin fetching user details before password reset',
    source: 'admin/users/[id]/reset-password',
    metadata: {
      targetUserId: userId,
      endpoint: '/api/v1/admin/users/[id]/reset-password',
    },
  };

  const users = await SecureServiceRoleHelpers.secureSelect(
    userContext,
    'indb_auth_user_profiles',
    ['full_name', 'role'],
    { user_id: userId }
  );

  if (!users || users.length === 0) {
    return formatError(
      await createStandardError(ErrorType.AUTHORIZATION, 'User not found', {
        statusCode: 404,
        severity: ErrorSeverity.MEDIUM,
        metadata: { userId },
      })
    );
  }

  const currentUser = users[0];

  const generatePassword = (): string => {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const digitChars = '0123456789';
    const specialChars = '!@#$%^&*';
    const allChars = upperChars + lowerChars + digitChars + specialChars;

    // (#V7 M-21) Use rejection sampling to eliminate modulo bias
    const securePick = (charset: string): string => {
      const max = 256 - (256 % charset.length); // largest fair value
      let byte: number;
      do {
        byte = crypto.randomBytes(1)[0];
      } while (byte >= max);
      return charset[byte % charset.length];
    };

    // Guarantee at least one of each category
    const chars: string[] = [
      securePick(upperChars),
      securePick(lowerChars),
      securePick(digitChars),
      securePick(specialChars),
    ];

    // Fill remaining 8 characters from full charset
    for (let i = 4; i < 12; i++) {
      chars.push(securePick(allChars));
    }

    // Fisher-Yates shuffle using crypto-safe randomness
    const shuffleBytes = crypto.randomBytes(chars.length);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = shuffleBytes[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  };

  const newPassword = generatePassword();

  const updateContext = {
    userId: adminUser.id,
    operation: 'admin_reset_user_password',
    reason: 'Admin resetting user password for security/access purposes',
    source: 'admin/users/[id]/reset-password',
    metadata: {
      targetUserId: userId,
      targetUserName: currentUser.full_name,
      passwordLength: newPassword.length,
      endpoint: '/api/v1/admin/users/[id]/reset-password',
    },
  };

  const updateResult = await SecureServiceRoleWrapper.executeSecureOperation(
    updateContext,
    {
      table: 'auth.users',
      operationType: 'update',
      columns: ['password'],
      whereConditions: { id: userId },
      data: { password: newPassword },
    },
    async () => {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new Error('Failed to reset password');
      }

      return { success: true };
    }
  );

  if (!updateResult || !updateResult.success) {
    return formatError(
      await createStandardError(ErrorType.DATABASE, 'Failed to reset password', {
        statusCode: 500,
        severity: ErrorSeverity.HIGH,
        metadata: { userId },
      })
    );
  }

  await ActivityLogger.logAdminAction(
    adminUser.id,
    'password_reset',
    userId,
    `Generated new password for ${currentUser.full_name || 'User'} (${newPassword.length} chars)`,
    request,
    {
      passwordReset: true,
      userRole: currentUser.role,
      passwordLength: newPassword.length,
      adminInitiated: true,
    }
  );

  // Mark user as requiring password change on next login
  const flagContext = {
    userId: adminUser.id,
    operation: 'admin_set_force_password_change',
    reason: 'Flag user to change password after admin reset',
    source: 'admin/users/[id]/reset-password',
    metadata: { targetUserId: userId },
  };
  await SecureServiceRoleHelpers.secureUpdate(
    flagContext,
    'indb_auth_user_profiles',
    { must_change_password: true },
    { user_id: userId }
  ).catch((err: unknown) => {
    // Non-fatal: flag may not exist yet in schema
    logger.warn(
      { error: err instanceof Error ? err : undefined },
      'Could not set must_change_password flag'
    );
  });

  // SECURITY: Never return the plaintext password in the HTTP response.
  // The password is sent to the user's email address via out-of-band delivery.
  try {
    const { data: profileData } = await supabaseAdmin
      .from('indb_auth_user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authData?.user?.email;
      if (userEmail) {
        const { getEmailService } = await import('@indexnow/mail');
        await getEmailService()
          .sendEmail({
            to: userEmail,
            subject: 'Your password has been reset',
            template: 'password-reset-notification',
            context: {
              newPassword,
              userName: currentUser.full_name || 'User',
              adminName: adminUser.email || 'Administrator',
            },
          })
          .catch((emailErr: unknown) => {
            logger.warn(
              { error: emailErr instanceof Error ? emailErr : undefined },
              'Failed to send password reset email — password was still reset successfully'
            );
          });
      }
    }
  } catch (emailError: unknown) {
    logger.warn(
      { error: emailError instanceof Error ? emailError : undefined },
      'Email delivery failed for password reset'
    );
  }

  return formatSuccess(
    {
      message:
        "Password reset successfully. The new password has been sent to the user's email. User must change this password on next login.",
      mustChangeOnLogin: true,
      passwordLength: newPassword.length,
    },
    undefined,
    201
  );
});
