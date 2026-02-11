import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { adminApiWrapper, createStandardError, formatError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { ActivityLogger } from '@/lib/monitoring/activity-logger'
import { logger } from '@/lib/monitoring/error-handling'
import { ErrorType, ErrorSeverity } from '@indexnow/shared'
import { type Json, type AdminOrderTransaction } from '@indexnow/shared'

// Type aliases for types not exported from @indexnow/database
type TransactionRow = any;
type TransactionMetadata = any;
type UpdateTransaction = any;
type UpdateUserProfile = any;

// Helper function to calculate expiry date based on billing period
function calculateExpiryDate(billingPeriod: string): Date {
  const now = new Date()

  switch (billingPeriod) {
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1))
    case 'quarterly':
      return new Date(now.setMonth(now.getMonth() + 3))
    case 'biannual':
      return new Date(now.setMonth(now.getMonth() + 6))
    case 'annual':
      return new Date(now.setFullYear(now.getFullYear() + 1))
    default:
      return new Date(now.setMonth(now.getMonth() + 1))
  }
}

// Helper function to activate user plan
async function activateUserPlan(transaction: TransactionRow, adminUserId: string) {
  const metadata = transaction.metadata as TransactionMetadata || {}
  const billingPeriod = metadata.billing_period || 'monthly'
  const expiryDate = calculateExpiryDate(billingPeriod)

  // Update user profile with new plan using secure wrapper
  const profileContext = {
    userId: adminUserId,
    operation: 'admin_activate_user_plan',
    reason: 'Admin activating user plan after payment confirmation',
    source: 'admin/orders/[id]/status',
    metadata: {
      transactionId: transaction.id,
      targetUserId: transaction.user_id,
      packageId: transaction.package_id,
      billingPeriod,
      expiryDate: expiryDate.toISOString()
    }
  }

  const updateData: UpdateUserProfile = {
    package_id: transaction.package_id,
    subscribed_at: new Date().toISOString(),
    expires_at: expiryDate.toISOString(),
    daily_quota_used: 0,
    daily_quota_reset_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    profileContext,
    {
      table: 'indb_auth_user_profiles',
      operationType: 'update',
      columns: Object.keys(updateData),
      whereConditions: { user_id: transaction.user_id },
      data: updateData
    },
    async () => {
      const { error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .update(updateData)
        .eq('user_id', transaction.user_id)

      if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`)
      }

      return { success: true }
    }
  )

  // Log plan activation
  try {
    await ActivityLogger.logAdminAction(
      adminUserId,
      'plan_activation',
      transaction.user_id,
      `Plan activated after payment confirmation for order ${transaction.id}`,
      undefined,
      {
        packageId: transaction.package_id,
        billingPeriod,
        expiresAt: expiryDate.toISOString(),
        transactionId: transaction.id,
        planActivation: true
      }
    )
  } catch (logError) {
    logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Failed to log plan activation:')
  }
}

export const PATCH = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: orderId } = await context.params

  // Parse request body
  const body = await request.json()
  const { status, notes } = body

  // Validate status
  const validStatuses = ['completed', 'failed']
  if (!validStatuses.includes(status)) {
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      'Invalid status. Must be "completed" or "failed"',
      { statusCode: 400, severity: ErrorSeverity.LOW, metadata: { status, validStatuses } }
    ))
  }

  // Get the current transaction to check current status using secure wrapper
  const transactionContext = {
    userId: adminUser.id,
    operation: 'admin_get_transaction_for_status_update',
    reason: 'Admin fetching transaction details for status update',
    source: 'admin/orders/[id]/status',
    metadata: {
      orderId,
      newStatus: status,
      endpoint: '/api/v1/admin/orders/[id]/status'
    }
  }

  const currentTransaction = await SecureServiceRoleWrapper.executeSecureOperation(
    transactionContext,
    {
      table: 'indb_payment_transactions',
      operationType: 'select',
      columns: ['*', 'package'],
      whereConditions: { id: orderId }
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_payment_transactions')
        .select(`
            *,
            package:indb_payment_packages(*)
          `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        throw new Error(error?.message || 'Transaction not found')
      }

      return data as TransactionRow
    }
  )

  if (!currentTransaction) {
    return formatError(await createStandardError(
      ErrorType.AUTHORIZATION,
      'Transaction not found',
      { statusCode: 404, severity: ErrorSeverity.LOW, metadata: { orderId } }
    ))
  }

  // Validate current status - can't update if already completed or failed
  if (currentTransaction.transaction_status === 'completed' || currentTransaction.transaction_status === 'failed') {
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      'Cannot update transactions that are already completed or failed',
      { statusCode: 400, severity: ErrorSeverity.LOW, metadata: { orderId, currentStatus: currentTransaction.transaction_status } }
    ))
  }

  // Update transaction status
  const updateData: UpdateTransaction = {
    transaction_status: status,
    verified_by: adminUser.id,
    verified_at: new Date().toISOString(),
    processed_at: status === 'completed' ? new Date().toISOString() : null,
    notes: notes || null,
    updated_at: new Date().toISOString()
  }

  const updateResult = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'admin_update_transaction_status',
      reason: `Admin updating transaction status to ${status}`,
      source: 'admin/orders/[id]/status',
      metadata: {
        orderId,
        newStatus: status,
        oldStatus: currentTransaction.transaction_status,
        endpoint: '/api/v1/admin/orders/[id]/status'
      }
    },
    {
      table: 'indb_payment_transactions',
      operationType: 'update',
      columns: Object.keys(updateData),
      whereConditions: { id: orderId },
      data: updateData
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_payment_transactions')
        .update(updateData)
        .eq('id', orderId)
        .select(`
            *,
            package:indb_payment_packages(*),
            gateway:indb_payment_gateways(*)
          `)
        .single()

      if (error) {
        throw new Error(`Failed to update transaction status: ${error.message}`)
      }

      return data
    }
  )

  // Type checking for the result
  if (!updateResult) {
    throw new Error('Failed to retrieve updated transaction')
  }

  const updatedTransaction = updateResult as any // We know it has joined props, will map manually

  // Get updated user profile using secure wrapper
  const updatedUserProfileContext = {
    userId: adminUser.id,
    operation: 'admin_get_updated_user_profile',
    reason: 'Admin fetching updated user profile after transaction status change',
    source: 'admin/orders/[id]/status',
    metadata: {
      orderId,
      targetUserId: updatedTransaction.user_id,
      endpoint: '/api/v1/admin/orders/[id]/status'
    }
  }

  const updatedUserProfile = await SecureServiceRoleWrapper.executeSecureOperation(
    updatedUserProfileContext,
    {
      table: 'indb_auth_user_profiles',
      operationType: 'select',
      columns: ['*'],
      whereConditions: { user_id: updatedTransaction.user_id }
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select('*')
        .eq('user_id', updatedTransaction.user_id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch updated user profile: ${error.message}`)
      }

      return data
    }
  )

  let verifierProfile = null
  if (updatedTransaction.verified_by) {
    const verifierProfileContext = {
      userId: adminUser.id,
      operation: 'admin_get_verifier_profile',
      reason: 'Admin fetching verifier profile for transaction status change',
      source: 'admin/orders/[id]/status',
      metadata: {
        orderId,
        verifierId: updatedTransaction.verified_by,
        endpoint: '/api/v1/admin/orders/[id]/status'
      }
    }

    verifierProfile = await SecureServiceRoleWrapper.executeSecureOperation(
      verifierProfileContext,
      {
        table: 'indb_auth_user_profiles',
        operationType: 'select',
        columns: ['user_id', 'full_name', 'role'],
        whereConditions: { user_id: updatedTransaction.verified_by }
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id, full_name, role')
          .eq('user_id', updatedTransaction.verified_by)
          .single()

        if (error) {
          throw new Error(`Failed to fetch verifier profile: ${error.message}`)
        }

        return data
      }
    )
  }

  // Map to AdminOrderTransaction
  const finalTransaction: AdminOrderTransaction = {
    id: updatedTransaction.id,
    user_id: updatedTransaction.user_id,
    package_id: updatedTransaction.package_id || '',
    gateway_id: updatedTransaction.gateway_id || '',
    transaction_type: 'payment', // Default for now, could be derived from package or metadata
    transaction_status: updatedTransaction.transaction_status,
    amount: updatedTransaction.amount,
    currency: updatedTransaction.currency,
    payment_method: updatedTransaction.payment_method,
    payment_proof_url: updatedTransaction.proof_url || null, // Map proof_url
    gateway_transaction_id: updatedTransaction.transaction_id || null, // Map transaction_id
    verified_by: updatedTransaction.verified_by,
    verified_at: updatedTransaction.verified_at,
    processed_at: updatedTransaction.processed_at,
    notes: updatedTransaction.notes,
    metadata: (updatedTransaction.metadata as Json) || {},
    created_at: updatedTransaction.created_at,
    updated_at: updatedTransaction.updated_at,
    package: updatedTransaction.package ? {
      id: updatedTransaction.package.id,
      name: updatedTransaction.package.name,
      slug: updatedTransaction.package.slug,
      description: updatedTransaction.package.description,
      pricing_tiers: updatedTransaction.package.pricing_tiers as Json,
      currency: updatedTransaction.package.currency || 'USD',
      billing_period: updatedTransaction.package.billing_period || 'monthly',
      features: updatedTransaction.package.features as Json
    } : null,
    gateway: updatedTransaction.gateway ? {
      id: updatedTransaction.gateway.id,
      name: updatedTransaction.gateway.name,
      slug: updatedTransaction.gateway.slug
    } : null,
    user: {
      user_id: updatedUserProfile.user_id,
      full_name: updatedUserProfile.full_name || 'Unknown',
      role: updatedUserProfile.role || 'user',
      email: 'N/A', // Email not available in profile join
      created_at: updatedUserProfile.created_at || new Date().toISOString(),
      package_id: updatedUserProfile.package_id,
      subscribed_at: (updatedUserProfile as any).subscription_start_date || (updatedUserProfile as any).subscribed_at,
      expires_at: (updatedUserProfile as any).subscription_end_date || (updatedUserProfile as any).expires_at,
      phone_number: updatedUserProfile.phone_number
    },
    verifier: verifierProfile ? {
      user_id: verifierProfile.user_id,
      full_name: verifierProfile.full_name || 'Unknown',
      role: verifierProfile.role || 'admin'
    } : null
  }

  // If approved, activate user plan
  if (status === 'completed') {
    try {
      await activateUserPlan(updatedTransaction, adminUser.id)
    } catch (error) {
      const activationError = error instanceof Error ? error : new Error(String(error))
      logger.error({ error: activationError.message }, 'Plan activation error:')
      // Rollback transaction status update if plan activation fails
      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: adminUser.id,
          operation: 'admin_rollback_transaction_status',
          reason: 'Admin rolling back transaction status due to plan activation failure',
          source: 'admin/orders/[id]/status',
          metadata: {
            orderId,
            rollbackReason: 'plan_activation_failed',
            endpoint: '/api/v1/admin/orders/[id]/status'
          }
        },
        {
          table: 'indb_payment_transactions',
          operationType: 'update',
          columns: ['transaction_status'],
          whereConditions: { id: orderId },
          data: { transaction_status: currentTransaction.transaction_status }
        },
        async () => {
          const { error } = await supabaseAdmin
            .from('indb_payment_transactions')
            .update({
              transaction_status: 'proof_uploaded',
              verified_by: null,
              verified_at: null,
              processed_at: null,
              notes: `Plan activation failed: ${activationError.message}`,
              updated_at: new Date().toISOString()
            } as UpdateTransaction)
            .eq('id', orderId)

          if (error) {
            throw new Error(`Failed to rollback transaction: ${error.message}`)
          }

          return { success: true }
        }
      )

      return formatError(await createStandardError(
        ErrorType.SYSTEM,
        `Payment approved but plan activation failed: ${activationError.message}`,
        { statusCode: 500, severity: ErrorSeverity.HIGH, metadata: { orderId, activationError: activationError.message } }
      ))
    }
  }

  // Log admin activity
  try {
    await ActivityLogger.logAdminAction(
      adminUser.id,
      'order_status_update',
      orderId,
      `Updated order ${currentTransaction.id} status from ${currentTransaction.transaction_status} to ${status}`,
      request,
      {
        previousStatus: currentTransaction.transaction_status,
        newStatus: status,
        orderId,
        customerId: currentTransaction.user_id,
        notes: notes || null,
        orderStatusUpdate: true
      }
    )
  } catch (logError) {
    logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Failed to log admin activity:')
  }

  return formatSuccess({
    message: `Order ${status === 'completed' ? 'approved' : 'rejected'} successfully${status === 'completed' ? ' and plan activated' : ''}`,
    transaction: finalTransaction
  })
})
