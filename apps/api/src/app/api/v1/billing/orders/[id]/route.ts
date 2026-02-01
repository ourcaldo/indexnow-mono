import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { logger } from '@/lib/monitoring/error-handling'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getBaseDomain(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL!).hostname
  } catch (e) {
    return ''
  }
}

interface OrderTransaction {
  id: string;
  user_id: string;
  amount: number | string;
  currency: string;
  transaction_status: string;
  created_at: string;
  updated_at: string | null;
  payment_method: string | null;
  gateway_transaction_id: string | null;
  billing_period: string | null;
  metadata: {
    customer_info?: Record<string, unknown>;
    payment_details?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  gateway_response: {
    va_numbers?: unknown;
    payment_code?: string;
    store?: string;
    expiry_time?: string;
    [key: string]: unknown;
  } | null;
  package: {
    id: string;
    name: string;
    description: string | null;
    features: unknown;
    quota_limits: unknown;
  } | null;
  [key: string]: unknown;
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

  const cookieStore = await cookies()
  const baseDomain = getBaseDomain()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none'; } }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                ...(baseDomain && { domain: `.${baseDomain}` })
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {}
        },
      },
    }
  )
  
  logger.info({ data: [auth.userId] }, '[ORDER-API] User authenticated:')

  logger.info({ data: [id, 'user_id:', auth.userId] }, '[ORDER-API] Searching for order ID:')
  
  const transaction = await SecureServiceRoleWrapper.executeWithUserSession<OrderTransaction>(
    supabase,
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

      return transaction as OrderTransaction
    }
  )
  
  logger.info({ data: [`order ID: ${transaction.id}`] }, '[ORDER-API] Order found successfully')

  const orderData = {
    order_id: transaction.id,
    transaction_id: transaction.gateway_transaction_id,
    status: transaction.transaction_status,
    payment_status: transaction.transaction_status,
    amount: transaction.amount,
    currency: transaction.currency,
    payment_method: transaction.payment_method,
    billing_period: transaction.billing_period || 'one-time',
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
    
    package: transaction.package,
    
    customer_info: transaction.metadata?.customer_info || {},
    
    payment_details: transaction.metadata?.payment_details || (transaction.gateway_response?.va_numbers ? {
      va_numbers: transaction.gateway_response?.va_numbers,
      payment_code: transaction.gateway_response?.payment_code,
      store: transaction.gateway_response?.store,
      expires_at: transaction.gateway_response?.expiry_time
    } : {})
  }

  return formatSuccess({
    success: true,
    data: orderData
  })
})


