import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { adminApiWrapper, createStandardError, formatError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { ActivityLogger } from '@/lib/monitoring/activity-logger'
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared'

export const POST = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  const quotaResetContext = {
    userId: adminUser.id,
    operation: 'admin_reset_user_quota',
    reason: 'Admin resetting daily quota usage for user',
    source: 'admin/users/[id]/reset-quota',
    metadata: {
      targetUserId: userId,
      endpoint: '/api/v1/admin/users/[id]/reset-quota'
    },
    ipAddress: getClientIP(request) ?? 'unknown',
    userAgent: request.headers.get('user-agent') || undefined || 'unknown'
  }

  const result = await SecureServiceRoleWrapper.executeSecureOperation(
    quotaResetContext,
    {
      table: 'indb_auth_user_profiles',
      operationType: 'update',
      data: {
        daily_quota_used: 0,
        daily_quota_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      },
      whereConditions: { user_id: userId }
    },
    async () => {
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select('full_name, daily_quota_used, package:indb_payment_packages(name)')
        .eq('user_id', userId)
        .single()

      if (userError || !currentUser) {
        throw new Error('User not found')
      }

      const { error: updateError } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .update({
          daily_quota_used: 0,
          daily_quota_reset_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        throw new Error(`Failed to reset quota: ${updateError.message}`)
      }

      return currentUser
    }
  )

  if (!result) {
    return formatError(await createStandardError(
      ErrorType.NOT_FOUND,
      'User not found',
      { statusCode: 404, severity: ErrorSeverity.MEDIUM, metadata: { userId } }
    ))
  }

  const currentUser = result

  await ActivityLogger.logAdminAction(
    adminUser.id,
    'quota_reset',
    userId,
    `Reset daily quota for ${currentUser.full_name || 'User'} (was ${currentUser.daily_quota_used || 0})`,
    request,
    {
      quotaReset: true,
      previousQuotaUsed: currentUser.daily_quota_used || 0,
      userFullName: currentUser.full_name
    }
  )

  return formatSuccess({
    message: `Daily quota successfully reset to 0`,
    previous_quota_used: currentUser.daily_quota_used || 0
  }, undefined, 201)
})

