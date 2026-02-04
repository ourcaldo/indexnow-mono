import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { logger } from '@/lib/monitoring/error-handling'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { DbTransactionRow as TransactionRow, DbPackageRow as PackageRow } from '@indexnow/shared'

type TransactionWithPackage = TransactionRow & {
  package: Pick<PackageRow, 'id' | 'name' | 'description' | 'features' | 'quota_limits'> | null
}

export const GET = authenticatedApiWrapper(async (
  request: NextRequest,
  auth,
  context?: { params: Promise<{ id: string }> }
) => {
  const params = context?.params ? await context.params : null
  const id = params?.id
  
  if (!id) {
    throw new Error('Order ID is required')
  }
  
  logger.info({ data: [id] }, '[ORDER-API] Received order ID:')
  
  logger.info({ data: [auth.userId] }, '[ORDER-API] User authenticated:')

  logger.info({ data: [id, 'user_id:', auth.userId] }, '[ORDER-API] Searching for order ID:')
  
  const transaction = await SecureServiceRoleWrapper.executeWithUserSession<TransactionWithPackage>(
    auth.supabase,
    {
      userId: auth.userId,
      operation: 'get_user_order_details',
      source: 'billing/orders/[id]',
      reason: 'User retrieving their order details',
      metadata: {
        orderId: id,
        endpoint: '/api/v1/billing/orders/[id]',
        method: 'GET'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent') || undefined
    },
    { table: 'indb_payment_transactions', operationType: 'select' },
    async (db) => {
      const { data: transaction, error: transactionError } = await db
        .from('indb_payment_transactions')
        .select(`
          *,
          package:indb_payment_packages(id, name, description, features, quota_limits)
        `)
        .eq('id', id)
        .eq('user_id', auth.userId)
        .single()

      logger.info({ data: [{
        found: !!transaction, error: transactionError?.message || null, orderId: transaction?.id || null
      }] }, '[ORDER-API] Query result:')

      if (transactionError || !transaction) {
        logger.info({ message: '[ORDER-API] Transaction not found for user' }, 'Info')
        throw new Error('Access denied')
      }

      return transaction as TransactionWithPackage
    }
  )
  
  logger.info({ data: [`order ID: ${transaction.id}`] }, '[ORDER-API] Order found successfully')

  // Safely access properties from gateway_response which has an index signature
  const gatewayResponse = transaction.gateway_response || {};
  
  const orderData = {
    order_id: transaction.id,
    transaction_id: transaction.gateway_transaction_id,
    status: transaction.status, // transaction_status was likely a typo or alias, TransactionRow has 'status'
    payment_status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    payment_method: transaction.payment_method,
    // billing_period is not in TransactionRow, it might be in metadata or inferred from package/subscription
    billing_period: transaction.metadata?.billing_period || 'one-time', 
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
    
    package: transaction.package,
    
    customer_info: transaction.metadata?.customer_info || {},
    
    payment_details: transaction.metadata?.payment_details || (gatewayResponse['va_numbers'] ? {
      va_numbers: gatewayResponse['va_numbers'],
      payment_code: gatewayResponse['payment_code'],
      store: gatewayResponse['store'],
      expires_at: gatewayResponse['expiry_time']
    } : {})
  }

  return formatSuccess({
    success: true,
    data: orderData
  })
})


