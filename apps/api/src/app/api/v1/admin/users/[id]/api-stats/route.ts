import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { getClientIP } from '@indexnow/shared'

interface UsageLog {
  operation: string;
  quota_used: number;
  status: string;
  created_at: string;
}

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context
) => {
  const { id: userId } = await context.params as Record<string, string>

  const { searchParams } = new URL(request.url)
  const parsedPage = parseInt(searchParams.get('page') || '1')
  const parsedLimit = parseInt(searchParams.get('limit') || '100')
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  const limit = Number.isNaN(parsedLimit) ? 100 : Math.min(500, Math.max(1, parsedLimit))
  const offset = (page - 1) * limit

  const result = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'admin_get_user_api_stats',
      reason: 'Admin fetching user API usage statistics',
      source: 'admin/users/[id]/api-stats',
      metadata: {
        targetUserId: userId,
        endpoint: '/api/v1/admin/users/[id]/api-stats',
        page,
        limit
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    },
    {
      table: 'indb_seranking_usage_logs',
      operationType: 'select',
      columns: ['operation', 'quota_used', 'status', 'created_at'],
      whereConditions: { user_id: userId }
    },
    async () => {
      const { data, error, count } = await (supabaseAdmin
        .from('indb_seranking_usage_logs') as ReturnType<typeof supabaseAdmin.from>)
        .select('operation, quota_used, status, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch API stats: ${error.message}`)
      }

      const usageLogs = (data || []) as UsageLog[]
      const total = count || 0

      return {
        totalRequests: total,
        totalQuotaUsed: usageLogs.reduce((acc, log) => acc + (log.quota_used || 0), 0),
        successCount: usageLogs.filter(log => log.status === 'success').length,
        errorCount: usageLogs.filter(log => log.status === 'error').length,
        recentLogs: usageLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: total > offset + limit,
          hasPrevPage: page > 1
        }
      }
    }
  )

  return formatSuccess(result)
})
