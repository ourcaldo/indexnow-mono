import { NextRequest } from 'next/server'
import { requireSuperAdminAuth } from '@/lib/auth'
import { SecureServiceRoleWrapper } from '@indexnow/database'
import { publicApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType } from '@/lib/monitoring/error-handling'

import { supabaseAdmin } from '@/lib/database'

export const GET = publicApiWrapper(async (request: NextRequest) => {
  try {
    await requireSuperAdminAuth(request)

    // Get system statistics using secure admin operation
    const systemStats = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'admin',
        operation: 'get_system_status',
        source: 'system/status',
        reason: 'Admin fetching system status and statistics',
        metadata: {
          endpoint: '/api/v1/system/status',
          method: 'GET'
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async () => {
        // Get system statistics
        const [usersResult] = await Promise.all([
          supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('user_id', { count: 'exact', head: true })
        ])

        // Get recent activity count (last 24 hours)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const { count: activityCount } = await supabaseAdmin
          .from('indb_security_activity_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString())

        return {
          usersCount: usersResult.count || 0,
          recentActivityCount: activityCount || 0
        }
      }
    )

    return formatSuccess({
      system: {
        status: 'operational',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform
      },
      database: {
        status: 'connected',
        total_users: systemStats.usersCount,
        recent_activity_24h: systemStats.recentActivityCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      const apiError = error as any
      return formatError(apiError)
    }

    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error as Error,
      {
        statusCode: 500,
        metadata: { endpoint: '/api/v1/system/status' }
      }
    )
    return formatError(structuredError)
  }
})
