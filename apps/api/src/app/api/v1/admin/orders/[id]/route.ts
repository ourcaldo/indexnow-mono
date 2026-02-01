import { SecureServiceRoleHelpers, SecureServiceRoleWrapper, type TransactionRow, type PackageRow, type UserProfile, type Json } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { adminApiWrapper, withDatabaseOperation, createStandardError } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ActivityLogger } from '@/lib/monitoring'
import { logger, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { supabaseAdmin } from '@/lib/database'

interface OrderWithRelations extends TransactionRow {
  package: PackageRow;
  gateway: {
    id: string;
    name: string;
    slug: string;
    description: string;
    configuration: Record<string, Json>;
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
              id,
              name,
              slug,
              description,
              pricing_tiers,
              currency,
              billing_period,
              features,
              quota_limits
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

        // Validate data structure matches OrderWithRelations
        const validatedData = data as unknown as OrderWithRelations;
        if (!validatedData.package) {
           throw new Error('Order package information is missing');
        }

        return validatedData;
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
    let userProfile: {
      full_name: string | null;
      role: string;
      phone_number: string | null;
      created_at: string;
      package_id: string | null;
      subscribed_at: string | null;
      expires_at: string | null;
      daily_quota_used: number;
    } | null = null
    let authUser: { user: { id: string; email?: string } } | null = null
    let verifierProfile: { user_id: string; full_name: string | null; role: string } | null = null

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
        ['full_name', 'role', 'phone_number', 'created_at', 'package_id', 'subscribed_at', 'expires_at', 'daily_quota_used'],
        { user_id: order.user_id as string }
      )

      userProfile = profiles.length > 0 ? (profiles[0] as Pick<UserProfile, 'full_name' | 'role' | 'phone_number' | 'created_at' | 'package_id' | 'subscribed_at' | 'expires_at' | 'daily_quota_used'>) : null
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
    if (order.verified_by) {
      try {
        const verifierContext = {
          userId: 'system',
          operation: 'admin_get_order_verifier_profile_detailed',
          reason: 'Admin fetching verifier profile for specific order',
          source: 'admin/orders/[id]',
          metadata: {
            orderId: orderId,
            verifierId: order.verified_by,
            endpoint: '/api/v1/admin/orders/[id]'
          }
        }

        const verifiers = await SecureServiceRoleHelpers.secureSelect(
          verifierContext,
          'indb_auth_user_profiles',
          ['user_id', 'full_name', 'role'],
          { user_id: order.verified_by }
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
    
    // Attach user and verifier data to order
    const orderWithEmail = {
      ...order,
      user: {
        user_id: order.user_id,
        full_name: userProfile?.full_name || 'Unknown User',
        email: authUser?.user?.email || 'N/A',
        role: userProfile?.role || 'user',
        phone_number: userProfile?.phone_number,
        created_at: userProfile?.created_at || order.created_at,
        package_id: userProfile?.package_id,
        subscribed_at: userProfile?.subscribed_at,
        expires_at: userProfile?.expires_at,
        daily_quota_used: userProfile?.daily_quota_used
      },
      verifier: verifierProfile
    }

    // Get activity history for this order using secure wrapper
    let activityHistory: Array<{
      id: string;
      event_type: string;
      action_description: string;
      created_at: string;
      user_id: string;
      metadata: Record<string, unknown> | null;
      user: Array<{ full_name: string; role: string }> | null;
    }> = []
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

      activityHistory = await SecureServiceRoleWrapper.executeSecureOperation<typeof activityHistory>(
        activityContext,
        {
          table: 'indb_security_activity_logs',
          operationType: 'select',
          columns: ['*', 'user'],
          whereConditions: { target_id: orderId }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_security_activity_logs')
            .select(`
              id,
              event_type,
              action_description,
              created_at,
              user_id,
              metadata,
              user:indb_auth_user_profiles(
                full_name,
                role
              )
            `)
            .or(`target_id.eq.${orderId},metadata->>transaction_id.eq.${orderId}`)
            .order('created_at', { ascending: false })
            .limit(20)

          if (error) {
            throw new Error(`Failed to fetch activity history: ${error.message}`)
          }

          return (data || []).map(item => ({
            id: String(item.id),
            event_type: String(item.event_type),
            action_description: String(item.action_description),
            created_at: String(item.created_at),
            user_id: String(item.user_id),
            metadata: item.metadata as Record<string, unknown> | null,
            user: Array.isArray(item.user) ? item.user as Array<{ full_name: string; role: string }> : null
          }))
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
    let transactionHistory: Array<{
      id: string;
      transaction_id: string;
      old_status: string;
      new_status: string;
      action_type: string;
      action_description: string;
      changed_by: string;
      changed_by_type: string;
      notes: string | null;
      metadata: Record<string, Json> | null;
      created_at: string;
      user: Array<{ full_name: string; role: string }> | null;
    }> = []
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

      transactionHistory = await SecureServiceRoleWrapper.executeSecureOperation<typeof transactionHistory>(
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
              notes,
              metadata,
              created_at,
              user:indb_auth_user_profiles!changed_by(
                full_name,
                role
              )
            `)
            .eq('transaction_id', orderId)
            .order('created_at', { ascending: false })

          if (error) {
            throw new Error(`Failed to fetch transaction history: ${error.message}`)
          }

          return (data || []).map(item => ({
            id: String(item.id),
            transaction_id: String(item.transaction_id),
            old_status: String(item.old_status),
            new_status: String(item.new_status),
            action_type: String(item.action_type),
            action_description: String(item.action_description),
            changed_by: String(item.changed_by),
            changed_by_type: String(item.changed_by_type),
            notes: item.notes as string | null,
            metadata: item.metadata as Record<string, Json> | null,
            created_at: String(item.created_at),
            user: Array.isArray(item.user) ? item.user as Array<{ full_name: string; role: string }> : null
          }))
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
      await ActivityLogger.logAdminAction(
        adminUser.id,
        'order_detail_view',
        orderId,
        `Viewed order details for ${order.id}`,
        request,
        {
          orderDetailView: true,
          orderId,
          orderStatus: order.transaction_status,
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

  return formatSuccess({
    order: orderWithEmail,
    activity_history: activityHistory || [],
    transaction_history: transactionHistory || []
  })
})
