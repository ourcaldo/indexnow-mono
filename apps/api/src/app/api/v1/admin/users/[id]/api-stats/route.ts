import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'

interface UsageLog {
  operation: string;
  quota_used: number;
  status: string;
  created_at: string;
}

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  const usageLogs = await SecureServiceRoleWrapper.executeSecureOperation<UsageLog[]>(
    {
      userId: adminUser.id,
      operation: 'admin_get_user_api_stats',
      reason: 'Admin fetching user API usage statistics',
      source: 'admin/users/[id]/api-stats',
      metadata: {
        targetUserId: userId,
        endpoint: '/api/v1/admin/users/[id]/api-stats'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    {
      table: 'indb_seranking_usage_logs',
      operationType: 'select',
      columns: ['operation', 'quota_used', 'status', 'created_at'],
      whereConditions: { user_id: userId }
    },
    async () => {
      const { data, error } = await (supabaseAdmin
        .from('indb_seranking_usage_logs') as ReturnType<typeof supabaseAdmin.from>)
        .select('operation, quota_used, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(`Failed to fetch API stats: ${error.message}`)
      }

      return (data || []) as UsageLog[]
    }
  )

  const stats = {
    totalRequests: usageLogs.length,
    totalQuotaUsed: usageLogs.reduce((acc, log) => acc + (log.quota_used || 0), 0),
    successCount: usageLogs.filter(log => log.status === 'success').length,
    errorCount: usageLogs.filter(log => log.status === 'error').length,
    recentLogs: usageLogs
  }

  return formatSuccess(stats)
})
