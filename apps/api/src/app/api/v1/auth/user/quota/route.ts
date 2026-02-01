import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'

interface QuotaData {
  package_name: string | null;
}

export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    const quotaData = await SecureServiceRoleWrapper.executeWithUserSession<QuotaData | null>(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_user_quota_summary',
        source: 'auth/user/quota',
        reason: 'User retrieving their own quota information for dashboard display',
        metadata: { endpoint: '/api/v1/auth/user/quota', method: 'GET' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'user_quota_summary', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('user_quota_summary')
          .select('*')
          .eq('user_id', auth.userId)
          .single()

        if (error && error.code !== 'PGRST116') throw new Error('Failed to fetch quota data')
        return data as QuotaData | null
      }
    )

    const packageName = quotaData?.package_name || 'Free'
    
    return formatSuccess({ 
      quota: {
        package_name: packageName,
      }
    })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error as Error,
      { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/auth/user/quota', method: 'GET', statusCode: 500 }
    )
    return formatError(structuredError)
  }
})

