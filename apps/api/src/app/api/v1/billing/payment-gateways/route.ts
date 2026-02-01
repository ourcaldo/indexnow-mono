import { NextRequest } from 'next/server'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { SecureServiceRoleWrapper } from '@indexnow/database'

/**
 * SECURITY FIX: This endpoint now requires authentication
 * Previously had NO authentication check - critical security vulnerability fixed
 */
export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    // Fetch active payment gateways using security wrapper
    const gateways = await SecureServiceRoleWrapper.executeWithUserSession(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_active_payment_gateways',
        source: 'billing/payment-gateways',
        reason: 'User fetching active payment gateways for checkout',
        metadata: { endpoint: '/api/v1/billing/payment-gateways' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_payment_gateways', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_gateways')
          .select('*')
          .eq('is_active', true)
          .order('is_default', { ascending: false })

        if (error) throw error
        return data || []
      }
    )

    return formatSuccess({
      gateways: gateways
    })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : String(error),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/billing/payment-gateways',
        method: 'GET',
        statusCode: 500
      }
    )
    return formatError(structuredError)
  }
})
