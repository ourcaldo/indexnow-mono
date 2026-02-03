import { SecureServiceRoleHelpers, SecureServiceRoleWrapper, SecurityActivityLog, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { adminApiWrapper, createStandardError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { logger, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'

interface ActivityLogsResult {
  logs: SecurityActivityLog[];
  count: number;
}

interface UserProfileSubset {
  full_name: string | null;
  user_id: string;
}

interface AuthUserSubset {
  id: string;
  email?: string;
}

export const GET = adminApiWrapper(async (
  request, 
  adminUser,
  context
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  // Fetch user's activity logs using secure wrapper
  let logs: SecurityActivityLog[] = []
  let count = 0
  let userProfile: UserProfileSubset | null = null
  let userEmail: string | undefined | null = null

  try {
    const logsContext = {
      userId: 'system',
      operation: 'admin_get_user_activity_logs',
      reason: 'Admin fetching user activity logs for review',
      source: 'admin/users/[id]/activity',
      metadata: {
        targetUserId: userId,
        page,
        limit,
        endpoint: '/api/v1/admin/users/[id]/activity'
      }
    }

    const logsResult = await SecureServiceRoleWrapper.executeSecureOperation<ActivityLogsResult>(
      logsContext,
      {
        table: 'indb_security_activity_logs',
        operationType: 'select',
        columns: ['*'],
        whereConditions: { user_id: userId }
      },
      async () => {
        const [logsQuery, countQuery] = await Promise.all([
          supabaseAdmin
            .from('indb_security_activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1),
          supabaseAdmin
            .from('indb_security_activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
        ])

        if (logsQuery.error) throw logsQuery.error
        if (countQuery.error) throw countQuery.error

        return {
          logs: (logsQuery.data || []) as SecurityActivityLog[],
          count: countQuery.count || 0
        }
      }
    )

    logs = logsResult.logs
    count = logsResult.count

    // Get user profile for context using secure wrapper
    const profileContext = {
      userId: 'system',
      operation: 'admin_get_user_profile_for_activity',
      reason: 'Admin fetching user profile for activity log context',
      source: 'admin/users/[id]/activity',
      metadata: {
        targetUserId: userId,
        endpoint: '/api/v1/admin/users/[id]/activity'
      }
    }

    const profiles = await SecureServiceRoleHelpers.secureSelect(
      profileContext,
      'indb_auth_user_profiles',
      ['full_name', 'user_id'],
      { user_id: userId }
    )

    userProfile = (profiles.length > 0 ? profiles[0] : null) as UserProfileSubset | null

    // Get user email using secure wrapper
    if (userProfile) {
      const targetUserId = userProfile.user_id
      try {
        const authContext = {
          userId: 'system',
          operation: 'admin_get_user_auth_for_activity',
          reason: 'Admin fetching user auth data for activity log context',
          source: 'admin/users/[id]/activity',
          metadata: {
            targetUserId: userId,
            endpoint: '/api/v1/admin/users/[id]/activity'
          }
        }

        const authUser = await SecureServiceRoleWrapper.executeSecureOperation<AuthUserSubset, string>(
          authContext,
          {
            table: 'auth.users',
            operationType: 'select',
            columns: ['id', 'email'],
            whereConditions: { id: targetUserId }
          },
          async () => {
            const { data, error } = await supabaseAdmin.auth.admin.getUserById(targetUserId)
            if (error || !data?.user) throw error
            return {
              id: data.user.id,
              email: data.user.email
            }
          }
        )

        userEmail = authUser.email
      } catch (authFetchError) {
        logger.error({ error: authFetchError instanceof Error ? authFetchError.message : String(authFetchError) }, `Failed to fetch auth data for user ${userId}:`)
      }
    }

  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching user activity data:')
    return await createStandardError(
      ErrorType.DATABASE,
      'Failed to fetch user activity logs',
      500,
      ErrorSeverity.HIGH,
      { error: error instanceof Error ? error.message : String(error) }
    )
  }

  return formatSuccess({ 
    logs: logs || [],
    user: {
      id: userId,
      name: userProfile?.full_name || 'Unknown User',
      email: userEmail || 'Unknown Email'
    },
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }, undefined, 200)
})
