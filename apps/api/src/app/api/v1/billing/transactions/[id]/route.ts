import { NextRequest } from 'next/server'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { SecureServiceRoleWrapper, TransactionRow } from '@indexnow/database'

interface TransactionDetail extends TransactionRow {
  package: Record<string, unknown> | null;
  gateway: Record<string, unknown> | null;
  metadata: Record<string, any> | null;
}

export const GET = authenticatedApiWrapper(async (request, auth, context) => {
  const params = context?.params ? await context.params : null
  const transactionId = params?.id

  if (!transactionId) {
    const error = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      'Transaction ID is required',
      {
        severity: ErrorSeverity.LOW,
        userId: auth.userId,
        endpoint: '/api/v1/billing/transactions/[id]',
        statusCode: 400
      }
    )
    return formatError(error)
  }

  try {
    // Fetch transaction with related data using security wrapper
    const transaction = await SecureServiceRoleWrapper.executeWithUserSession<TransactionDetail | null>(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_transaction_details',
        source: 'billing/transactions/[id]',
        reason: 'User fetching transaction details',
        metadata: { transactionId, endpoint: '/api/v1/billing/transactions/[id]' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_payment_transactions', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_transactions')
          .select(`
            *,
            package:indb_payment_packages(*),
            gateway:indb_payment_gateways(*)
          `)
          .eq('id', transactionId)
          .eq('user_id', auth.userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        return data as TransactionDetail | null
      }
    )

    if (!transaction) {
      const error = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        'Transaction not found or access denied',
        {
          severity: ErrorSeverity.LOW,
          userId: auth.userId,
          endpoint: '/api/v1/billing/transactions/[id]',
          statusCode: 404,
          metadata: { transactionId }
        }
      )
      return formatError(error)
    }

    // Parse customer info from metadata
    const customerInfo = (transaction.metadata as Record<string, any>)?.customer_info || {}

    return formatSuccess({
      transaction: {
        ...transaction,
        customer_info: customerInfo
      }
    })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : String(error),
      { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: `/api/v1/billing/transactions/${transactionId}`, method: 'GET', statusCode: 500 }
    )
    return formatError(structuredError)
  }
})
