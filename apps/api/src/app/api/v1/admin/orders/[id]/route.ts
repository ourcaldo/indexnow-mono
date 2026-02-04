import { 
  type Json, 
  type PackageRow, 
  SecureServiceRoleHelpers, 
  SecureServiceRoleWrapper, 
  type TransactionRow, 
  type UserProfile, 
  supabaseAdmin 
} from '@indexnow/database';
import { NextRequest } from 'next/server'
import { adminApiWrapper, createStandardError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { ServerActivityLogger } from '@/lib/monitoring'
import { logger, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { 
  type AdminOrderDetailResponse, 
  type AdminOrderTransaction, 
  type AdminTransactionHistory, 
  type AdminOrderActivityLog 
} from '@indexnow/shared'

interface OrderWithRelations extends TransactionRow {
  package: PackageRow | null;
  gateway: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pricing_tiers: Json;
    configuration: Json;
  } | null;
}

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<{ id: string }> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: orderId } = await context.params

    // Fetch order with all related data using secure wrapper
    const orderContext = {
      userId: adminUser.id,
      operation: 'admin_get_order_details',
      reason: 'Admin fetching individual order details for management',
      source: 'admin/orders/[id]',
      metadata: {
        orderId,
        endpoint: '/api/v1/admin/orders/[id]'
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined || 'unknown'
    }

    const order = await SecureServiceRoleWrapper.executeSecureOperation<OrderWithRelations>(
      orderContext,
      {
        table: 'indb_payment_transactions',
        operationType: 'select',
        columns: ['*', 'package', 'gateway'],
        whereConditions: { id: orderId }
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_transactions')
          .select(`
            *,
            package:indb_payment_packages(
              *
            ),
            gateway:indb_payment_gateways(
              id,
              name,
              slug,
              description,
              pricing_tiers,
              configuration
            )
          `)
          .eq('id', orderId)
          .single()

        if (error || !data) {
          throw new Error(error?.message || 'Order not found')
        }

        return data as unknown as OrderWithRelations;
      }
    )

  if (!order) {
    logger.error({
      userId: adminUser.id,
      endpoint: '/api/v1/admin/orders/[id]',
      method: 'GET',
      orderId
    }, 'Admin order lookup - Order not found')
    return createStandardError(
      ErrorType.AUTHORIZATION,
      'Order not found',
      404,
      ErrorSeverity.LOW
    )
  }

    // Get user profile data using secure wrapper
    let userProfile: UserProfile | null = null
    let authUser: { user: { id: string; email?: string } } | null = null
    let verifierProfile: Pick<UserProfile, 'user_id' | 'full_name' | 'role'> | null = null

    try {
      const profileContext = {
        userId: 'system',
        operation: 'admin_get_order_user_profile_detailed',
        reason: 'Admin fetching detailed user profile for specific order',
        source: 'admin/orders/[id]',
        metadata: {
          orderId: orderId,
          targetUserId: order.user_id,
          endpoint: '/api/v1/admin/orders/[id]'
        }
      }

      const profiles = await SecureServiceRoleHelpers.secureSelect(
        profileContext,
        'indb_auth_user_profiles',
        ['*'],
        { user_id: order.user_id as string }
      )

      userProfile = profiles.length > 0 ? (profiles[0] as UserProfile) : null
    } catch (error) {
      logger.error({
        userId: adminUser.id,
        endpoint: '/api/v1/admin/orders/[id]',
        method: 'GET',
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Error fetching user profile for order ${orderId}`)
    }

    // Get user's email from Supabase Auth using secure wrapper
    try {
      const authContext = {
        userId: 'system',
        operation: 'admin_get_order_user_auth_detailed',
        reason: 'Admin fetching user auth data for specific order',
        source: 'admin/orders/[id]',
        metadata: {
          orderId: orderId,
          targetUserId: order.user_id,
          endpoint: '/api/v1/admin/orders/[id]'
        }
      }

      authUser = await SecureServiceRoleWrapper.executeSecureOperation<{ user: { id: string; email?: string } }, string>(
        authContext,
        {
          table: 'auth.users',
          operationType: 'select',
          columns: ['id', 'email'],
          whereConditions: { id: order.user_id }
        },
        async () => {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
          if (error || !data?.user) throw error
          return {
            user: {
              id: data.user.id,
              email: data.user.email
            }
          }
        }
      )
    } catch (error) {
      logger.error({
        userId: adminUser.id,
        endpoint: '/api/v1/admin/orders/[id]',
        method: 'GET',
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, `Error fetching auth data for order ${orderId}`)
    }
    
    // Get verifier profile if exists using secure wrapper
    if (order.metadata?.verified_by) {
      const verifierId = String(order.metadata.verified_by);
      try {
        const verifierContext = {
          userId: 'system',
          operation: 'admin_get_order_verifier_profile_detailed',
          reason: 'Admin fetching verifier profile for specific order',
          source: 'admin/orders/[id]',
          metadata: {
            orderId: orderId,
            verifierId: verifierId,
            endpoint: '/api/v1/admin/orders/[id]'
          }
        }

        const verifiers = await SecureServiceRoleHelpers.secureSelect(
          verifierContext,
          'indb_auth_user_profiles',
          ['user_id', 'full_name', 'role'],
          { user_id: verifierId }
        )

        verifierProfile = verifiers.length > 0 ? (verifiers[0] as Pick<UserProfile, 'user_id' | 'full_name' | 'role'>) : null
      } catch (error) {
        logger.error({
          userId: adminUser.id,
          endpoint: '/api/v1/admin/orders/[id]',
          method: 'GET',
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, `Error fetching verifier profile for order ${orderId}`)
      }
    }
    
    // Construct AdminOrderTransaction
    const adminOrderTransaction: AdminOrderTransaction = {
      id: order.id,
      user_id: order.user_id,
      package_id: order.package_id || '',
      gateway_id: order.gateway_id || '',
      transaction_type: 'payment', // Default or derived
      transaction_status: order.status,
      amount: order.amount,
      currency: order.currency,
      payment_method: order.payment_method,
      payment_proof_url: order.proof_url,
      gateway_transaction_id: order.transaction_id,
      verified_by: (order.metadata?.verified_by as string) || null,
      verified_at: (order.metadata?.verified_at as string) || null,
      processed_at: (order.metadata?.processed_at as string) || null,
      notes: order.notes,
      metadata: order.metadata || {},
      created_at: order.created_at,
      updated_at: order.updated_at,
      package: order.package ? {
        id: order.package.id,
        name: order.package.name,
        slug: order.package.slug,
        description: order.package.description,
        pricing_tiers: order.package.pricing_tiers,
        currency: order.package.currency || 'USD',
        billing_period: order.package.billing_period || 'monthly',
        features: order.package.features || {}
      } : null,
      gateway: order.gateway ? {
        id: order.gateway.id,
        name: order.gateway.name,
        slug: order.gateway.slug
      } : null,
      user: {
        user_id: order.user_id,
        full_name: userProfile?.full_name || 'Unknown User',
        role: userProfile?.role || 'user',
        email: authUser?.user?.email || 'N/A',
        created_at: userProfile?.created_at || order.created_at,
        package_id: userProfile?.package_id,
        subscribed_at: userProfile?.subscription_start_date, // Mapped from subscription_start_date
        expires_at: userProfile?.subscription_end_date, // Mapped from subscription_end_date
        phone_number: userProfile?.phone_number
      },
      verifier: verifierProfile ? {
        user_id: verifierProfile.user_id,
        full_name: verifierProfile.full_name || 'Unknown',
        role: verifierProfile.role
      } : null
    };

    // Get activity history for this order using secure wrapper
    let activityHistory: AdminOrderActivityLog[] = []
    try {
      const activityContext = {
        userId: adminUser.id,
        operation: 'admin_get_order_activity_history',
        reason: 'Admin fetching security activity history for order details',
        source: 'admin/orders/[id]',
        metadata: {
          orderId,
          endpoint: '/api/v1/admin/orders/[id]'
        }
      }

      activityHistory = await SecureServiceRoleWrapper.executeSecureOperation<AdminOrderActivityLog[]>(
        activityContext,
        {
          table: 'indb_security_activity_logs',
          operationType: 'select',
          columns: ['*', 'user'],
          whereConditions: { id: orderId } // Approximation for security check
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_security_activity_logs')
            .select(`
              id,
              event_type,
              details,
              created_at,
              user_id,
              user:indb_auth_user_profiles(
                user_id,
                full_name,
                role
              )
            `)
            .or(`details->>target_id.eq.${orderId},details->>transaction_id.eq.${orderId}`)
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) {
            throw new Error(`Failed to fetch activity history: ${error.message}`)
          }

          return (data || []).map(item => {
             const user = Array.isArray(item.user) ? item.user[0] : item.user;
             return {
              id: String(item.id),
              admin_id: String(item.user_id || ''), // Assuming user_id is the actor
              action_type: String(item.event_type),
              action_description: 'Activity Log', // Description not directly in table, using placeholder or deriving
              target_type: 'order',
              target_id: orderId,
              metadata: item.details as Json,
              created_at: String(item.created_at),
              user: user ? {
                user_id: user.user_id,
                full_name: user.full_name || 'Unknown',
                email: 'N/A', // Email not available in profile join
                role: user.role
              } : null
            } as AdminOrderActivityLog;
          })
        }
      )
    } catch (error) {
      logger.error({
        userId: adminUser.id,
        endpoint: '/api/v1/admin/orders/[id]',
        method: 'GET',
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Error fetching order activity history')
    }

    // Get transaction history from the dedicated history table using secure wrapper
    let transactionHistory: AdminTransactionHistory[] = []
    try {
      const transactionContext = {
        userId: adminUser.id,
        operation: 'admin_get_order_transaction_history',
        reason: 'Admin fetching transaction history for order details',
        source: 'admin/orders/[id]',
        metadata: {
          orderId,
          endpoint: '/api/v1/admin/orders/[id]'
        }
      }

      transactionHistory = await SecureServiceRoleWrapper.executeSecureOperation<AdminTransactionHistory[]>(
        transactionContext,
        {
          table: 'indb_payment_transactions_history',
          operationType: 'select',
          columns: ['*', 'user'],
          whereConditions: { transaction_id: orderId }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_transactions_history')
            .select(`
              id,
              transaction_id,
              old_status,
              new_status,
              action_type,
              action_description,
              changed_by,
              changed_by_type,
              old_values,
              new_values,
              notes,
              metadata,
              ip_address,
              user_agent,
              created_at,
              user:indb_auth_user_profiles!changed_by(
                user_id,
                full_name,
                role
              )
            `)
            .eq('transaction_id', orderId)
            .order('created_at', { ascending: false })

          if (error) {
            throw new Error(`Failed to fetch transaction history: ${error.message}`)
          }

          return (data || []).map(item => {
            const user = Array.isArray(item.user) ? item.user[0] : item.user;
            return {
              id: String(item.id),
              transaction_id: String(item.transaction_id),
              old_status: item.old_status,
              new_status: String(item.new_status),
              action_type: String(item.action_type),
              action_description: String(item.action_description),
              changed_by: item.changed_by,
              changed_by_type: String(item.changed_by_type),
              old_values: item.old_values,
              new_values: item.new_values,
              notes: item.notes,
              metadata: item.metadata,
              ip_address: item.ip_address,
              user_agent: item.user_agent,
              created_at: String(item.created_at),
              user: user ? {
                user_id: user.user_id,
                full_name: user.full_name || 'Unknown',
                email: 'N/A', // Email not available in profile join
                role: user.role
              } : null
            };
          })
        }
      )
    } catch (error) {
      logger.error({
        userId: adminUser.id,
        endpoint: '/api/v1/admin/orders/[id]',
        method: 'GET',
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Error fetching transaction history')
    }

    // Log admin activity
    try {
      await ServerActivityLogger.logAdminAction(
        adminUser.id,
        'order_detail_view',
        orderId,
        `Viewed order details for ${order.id}`,
        request,
        {
          orderDetailView: true,
          orderId,
          orderStatus: order.status,
          orderAmount: order.amount,
          customerId: order.user_id
        }
      )
    } catch (logError) {
      logger.error({
        userId: adminUser.id,
        endpoint: '/api/v1/admin/orders/[id]',
        method: 'GET',
        orderId,
        error: logError instanceof Error ? logError.message : 'Unknown error'
      }, 'Failed to log admin activity')
    }

  const response: AdminOrderDetailResponse = {
    order: adminOrderTransaction,
    activity_history: activityHistory,
    transaction_history: transactionHistory
  };

  return formatSuccess(response);
})
