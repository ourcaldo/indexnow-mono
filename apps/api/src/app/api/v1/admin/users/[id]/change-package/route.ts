import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
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
  const body = await request.json()
  const { packageId, reason, effectiveDate, notifyUser } = body

  if (!packageId) {
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      'Package ID is required',
      { statusCode: 400, severity: ErrorSeverity.LOW, metadata: { field: 'packageId' } }
    ))
  }

  const packageResult = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'admin_verify_package',
      reason: 'Admin verifying package exists before assignment',
      source: 'admin/users/[id]/change-package',
      metadata: {
        targetUserId: userId,
        packageId: packageId,
        endpoint: '/api/v1/admin/users/[id]/change-package'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    {
      table: 'indb_payment_packages',
      operationType: 'select',
      columns: ['id', 'name', 'slug'],
      whereConditions: { id: packageId, is_active: true }
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_payment_packages')
        .select('id, name, slug')
        .eq('id', packageId)
        .eq('is_active', true)
        .single()
      return { data, error }
    }
  )

  const { data: packageData, error: packageError } = packageResult

  if (packageError || !packageData) {
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      'Invalid package selected',
      { statusCode: 400, severity: ErrorSeverity.LOW, metadata: { packageId } }
    ))
  }

  const userResult = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'admin_get_user_for_package_change',
      reason: 'Admin fetching user data before package change',
      source: 'admin/users/[id]/change-package',
      metadata: {
        targetUserId: userId,
        newPackageId: packageId,
        endpoint: '/api/v1/admin/users/[id]/change-package'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    {
      table: 'indb_auth_user_profiles',
      operationType: 'select',
      columns: ['full_name', 'package_id', 'package'],
      whereConditions: { user_id: userId }
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select('full_name, package_id, package:indb_payment_packages(name)')
        .eq('user_id', userId)
        .single()

      return {
        data: data as {
          full_name: string | null;
          package_id: string | null;
          package: { name: string } | Array<{ name: string }> | null
        } | null,
        error
      }
    }
  )

  const { data: currentUser, error: userError } = userResult

  if (userError || !currentUser) {
    return formatError(await createStandardError(
      ErrorType.AUTHORIZATION,
      'User not found',
      { statusCode: 404, severity: ErrorSeverity.MEDIUM, metadata: { userId } }
    ))
  }

  const updateResult = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'admin_update_user_package',
      reason: `Admin changing user package from ${Array.isArray(currentUser.package) ? currentUser.package[0]?.name : currentUser.package?.name || 'No Package'} to ${packageData.name}`,
      source: 'admin/users/[id]/change-package',
      metadata: {
        targetUserId: userId,
        targetUserName: currentUser.full_name,
        oldPackageId: currentUser.package_id,
        newPackageId: packageId,
        newPackageName: packageData.name,
        newPackageSlug: packageData.slug,
        resetQuota: true,
        endpoint: '/api/v1/admin/users/[id]/change-package'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    {
      table: 'indb_auth_user_profiles',
      operationType: 'update',
      columns: ['package_id', 'subscribed_at', 'expires_at', 'daily_quota_used', 'daily_quota_reset_date', 'updated_at'],
      whereConditions: { user_id: userId },
      data: {
        package_id: packageId,
        subscribed_at: new Date().toISOString(),
        expires_at: packageData.slug === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daily_quota_used: 0,
        daily_quota_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }
    },
    async () => {
      const { error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .update({
          package_id: packageId,
          subscribed_at: new Date().toISOString(),
          expires_at: packageData.slug === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daily_quota_used: 0,
          daily_quota_reset_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      return { error }
    }
  )

  const { error: updateError } = updateResult

  if (updateError) {
    return formatError(await createStandardError(
      ErrorType.DATABASE,
      'Failed to change package',
      { statusCode: 500, severity: ErrorSeverity.HIGH, metadata: { userId, packageId } }
    ))
  }

  const oldPackageName = Array.isArray(currentUser.package) ?
    currentUser.package[0]?.name : currentUser.package?.name || 'No Package'

  await ActivityLogger.logAdminAction(
    adminUser.id,
    'package_change',
    userId,
    `Changed package for ${currentUser.full_name || 'User'} from "${oldPackageName}" to "${packageData.name}"`,
    request,
    {
      packageChange: true,
      oldPackageId: currentUser.package_id,
      newPackageId: packageId,
      oldPackageName,
      newPackageName: packageData.name,
      userFullName: currentUser.full_name
    }
  )

  return formatSuccess({
    message: `Package successfully changed to ${packageData.name}`,
    package: packageData
  }, undefined, 201)
})

