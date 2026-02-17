import { SecureServiceRoleHelpers, SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import crypto from 'crypto';
import { adminApiWrapper, createStandardError, formatError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { ActivityLogger } from '@/lib/monitoring/activity-logger'
import { ErrorType, ErrorSeverity } from '@indexnow/shared'

export const POST = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  const userContext = {
    userId: adminUser.id,
    operation: 'admin_get_user_for_password_reset',
    reason: 'Admin fetching user details before password reset',
    source: 'admin/users/[id]/reset-password',
    metadata: {
      targetUserId: userId,
      endpoint: '/api/v1/admin/users/[id]/reset-password'
    }
  }

  const users = await SecureServiceRoleHelpers.secureSelect(
    userContext,
    'indb_auth_user_profiles',
    ['full_name', 'role'],
    { user_id: userId }
  )

  if (!users || users.length === 0) {
    return formatError(await createStandardError(
      ErrorType.AUTHORIZATION,
      'User not found',
      { statusCode: 404, severity: ErrorSeverity.MEDIUM, metadata: { userId } }
    ))
  }

  const currentUser = users[0]

  const generatePassword = (): string => {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const digitChars = '0123456789';
    const specialChars = '!@#$%^&*';
    const allChars = upperChars + lowerChars + digitChars + specialChars;

    // Use cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(16);
    const pick = (charset: string, byteIndex: number): string =>
      charset[randomBytes[byteIndex] % charset.length];

    // Guarantee at least one of each category
    const chars: string[] = [
      pick(upperChars, 0),
      pick(lowerChars, 1),
      pick(digitChars, 2),
      pick(specialChars, 3),
    ];

    // Fill remaining 8 characters from full charset
    for (let i = 4; i < 12; i++) {
      chars.push(pick(allChars, i));
    }

    // Fisher-Yates shuffle using crypto-safe randomness
    const shuffleBytes = crypto.randomBytes(chars.length);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = shuffleBytes[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }

  const newPassword = generatePassword()

  const updateContext = {
    userId: adminUser.id,
    operation: 'admin_reset_user_password',
    reason: 'Admin resetting user password for security/access purposes',
    source: 'admin/users/[id]/reset-password',
    metadata: {
      targetUserId: userId,
      targetUserName: currentUser.full_name,
      passwordLength: newPassword.length,
      endpoint: '/api/v1/admin/users/[id]/reset-password'
    }
  }

  const updateResult = await SecureServiceRoleWrapper.executeSecureOperation(
    updateContext,
    {
      table: 'auth.users',
      operationType: 'update',
      columns: ['password'],
      whereConditions: { id: userId },
      data: { password: newPassword }
    },
    async () => {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) {
        throw new Error('Failed to reset password')
      }

      return { success: true }
    }
  )

  if (!updateResult || !updateResult.success) {
    return formatError(await createStandardError(
      ErrorType.DATABASE,
      'Failed to reset password',
      { statusCode: 500, severity: ErrorSeverity.HIGH, metadata: { userId } }
    ))
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
      adminInitiated: true
    }
  )

  return formatSuccess({
    newPassword: newPassword,
    message: 'Password reset successfully. User must change this password on next login.',
    mustChangeOnLogin: true
  }, undefined, 201)
})
