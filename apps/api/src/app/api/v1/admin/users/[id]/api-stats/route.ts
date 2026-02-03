import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { supabaseAdmin } from '@indexnow/database'

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<{ id: string }> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  // Fetch API stats from usage logs
  const { data: usageLogs, error } = await supabaseAdmin
    .from('indb_seranking_usage_logs')
    .select('operation, quota_used, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw error
  }

  // Aggregate stats
  const stats = {
    totalRequests: usageLogs?.length || 0,
    totalQuotaUsed: usageLogs?.reduce((acc, log) => acc + (log.quota_used || 0), 0) || 0,
    successCount: usageLogs?.filter(log => log.status === 'success').length || 0,
    errorCount: usageLogs?.filter(log => log.status === 'error').length || 0,
    recentLogs: usageLogs || []
  }

  return formatSuccess(stats)
})
