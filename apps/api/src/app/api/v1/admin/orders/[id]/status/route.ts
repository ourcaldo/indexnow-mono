import {
  SecureServiceRoleWrapper,
  supabaseAdmin,
  type ServiceRoleOperationContext,
} from '@indexnow/database';
import { NextRequest } from 'next/server';
import {
  adminApiWrapper,
  createStandardError,
  formatError,
} from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { logger } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { type Json, type AdminOrderTransaction } from '@indexnow/shared';
import { z } from 'zod';

/**
 * A-02 (resolved): Order status update + plan activation is now atomic via
 * the `activate_order_with_plan` Postgres RPC
 * (see database-schema/migrations/001_atomic_order_activation.sql).
 * The RPC locks the transaction row, prevents terminal-status changes,
 * updates the status, and — when completing — activates the user plan
 * in a single transaction.
 */

/** Supabase join result for payment transaction with package relation */
interface TransactionRow {
  id: string;
  user_id: string;
  package_id: string | null;
  gateway_id: string | null;
  status: 'pending' | 'proof_uploaded' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transaction_status: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  proof_url: string | null;
  transaction_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  processed_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  package: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pricing_tiers: Json;
    currency: string | null;
    billing_period: string | null;
    features: Json;
  } | null;
  gateway: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const orderStatusSchema = z.object({
  status: z.enum(['completed', 'failed']),
  notes: z.string().optional(),
});

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser, context) => {
  const { id: orderId } = (await context.params) as Record<string, string>;

  // Parse request body
  const body = await request.json();
  const parseResult = orderStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return formatError(
      await createStandardError(
        ErrorType.VALIDATION,
        parseResult.error.errors[0]?.message || 'Invalid request body',
        { statusCode: 400, severity: ErrorSeverity.LOW }
      )
    );
  }
  const { status, notes } = parseResult.data;

  // Get the current transaction to check current status using secure wrapper
  const transactionContext = {
    userId: adminUser.id,
    operation: 'admin_get_transaction_for_status_update',
    reason: 'Admin fetching transaction details for status update',
    source: 'admin/orders/[id]/status',
    metadata: {
      orderId,
      newStatus: status,
      endpoint: '/api/v1/admin/orders/[id]/status',
    },
  };

  const currentTransaction = await SecureServiceRoleWrapper.executeSecureOperation(
    transactionContext,
    {
      table: 'indb_payment_transactions',
      operationType: 'select',
      columns: ['*', 'package'],
      whereConditions: { id: orderId },
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_payment_transactions')
        .select(
          `
            *,
            package:indb_payment_packages(*)
          `
        )
        .eq('id', orderId)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Transaction not found');
      }

      return data as unknown as TransactionRow;
    }
  );

  if (!currentTransaction) {
    return formatError(
      await createStandardError(ErrorType.AUTHORIZATION, 'Transaction not found', {
        statusCode: 404,
        severity: ErrorSeverity.LOW,
        metadata: { orderId },
      })
    );
  }

  // Validate current status - can't update if already completed or failed
  if (currentTransaction.status === 'completed' || currentTransaction.status === 'failed') {
    return formatError(
      await createStandardError(
        ErrorType.VALIDATION,
        'Cannot update transactions that are already completed or failed',
        {
          statusCode: 400,
          severity: ErrorSeverity.LOW,
          metadata: { orderId, currentStatus: currentTransaction.status },
        }
      )
    );
  }

  // Atomic status update + plan activation via RPC (A-02 fix)
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('activate_order_with_plan', {
    p_transaction_id: orderId,
    p_new_status: status,
    p_admin_user_id: adminUser.id,
    p_notes: notes || null,
  });

  if (rpcError) {
    throw new Error(`Failed to update order status: ${rpcError.message}`);
  }

  const rpcData = rpcResult as unknown as Record<string, unknown> | null;

  if (!rpcData || rpcData.error) {
    if (rpcData?.error === 'transaction_not_found') {
      return formatError(
        await createStandardError(ErrorType.AUTHORIZATION, 'Transaction not found', {
          statusCode: 404,
          severity: ErrorSeverity.LOW,
          metadata: { orderId },
        })
      );
    }
    if (rpcData?.error === 'terminal_status') {
      return formatError(
        await createStandardError(
          ErrorType.VALIDATION,
          'Cannot update transactions that are already completed or failed',
          {
            statusCode: 400,
            severity: ErrorSeverity.LOW,
            metadata: { orderId, currentStatus: String(rpcData.current_status) },
          }
        )
      );
    }
    throw new Error('Unexpected RPC response');
  }

  // Merge RPC result (DB column names) with pre-fetched join data
  const updatedTransaction: TransactionRow = {
    ...currentTransaction,
    status: rpcData.status as TransactionRow['status'],
    verified_by: (rpcData.verified_by as string) ?? null,
    verified_at: (rpcData.verified_at as string) ?? null,
    processed_at: (rpcData.processed_at as string) ?? null,
    notes: (rpcData.notes as string) ?? null,
    updated_at: rpcData.updated_at as string,
  };

  // Get updated user profile using secure wrapper
  const updatedUserProfileContext: ServiceRoleOperationContext = {
    userId: adminUser.id,
    operation: 'admin_get_updated_user_profile',
    reason: 'Admin fetching updated user profile after transaction status change',
    source: 'admin/orders/[id]/status',
    metadata: {
      orderId,
      targetUserId: updatedTransaction.user_id ?? '',
      endpoint: '/api/v1/admin/orders/[id]/status',
    },
  };

  const updatedUserProfile = await SecureServiceRoleWrapper.executeSecureOperation(
    updatedUserProfileContext,
    {
      table: 'indb_auth_user_profiles',
      operationType: 'select',
      columns: ['*'],
      whereConditions: { user_id: updatedTransaction.user_id },
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select('*')
        .eq('user_id', updatedTransaction.user_id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch updated user profile: ${error.message}`);
      }

      return data;
    }
  );

  let verifierProfile = null;
  if (updatedTransaction.verified_by) {
    const verifierProfileContext: ServiceRoleOperationContext = {
      userId: adminUser.id,
      operation: 'admin_get_verifier_profile',
      reason: 'Admin fetching verifier profile for transaction status change',
      source: 'admin/orders/[id]/status',
      metadata: {
        orderId,
        verifierId: updatedTransaction.verified_by ?? '',
        endpoint: '/api/v1/admin/orders/[id]/status',
      },
    };

    verifierProfile = await SecureServiceRoleWrapper.executeSecureOperation(
      verifierProfileContext,
      {
        table: 'indb_auth_user_profiles',
        operationType: 'select',
        columns: ['user_id', 'full_name', 'role'],
        whereConditions: { user_id: updatedTransaction.verified_by },
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id, full_name, role')
          .eq('user_id', updatedTransaction.verified_by!)
          .single();

        if (error) {
          throw new Error(`Failed to fetch verifier profile: ${error.message}`);
        }

        return data;
      }
    );
  }

  // Map to AdminOrderTransaction
  const finalTransaction: AdminOrderTransaction = {
    id: updatedTransaction.id,
    user_id: updatedTransaction.user_id,
    package_id: updatedTransaction.package_id || '',
    gateway_id: updatedTransaction.gateway_id || '',
    transaction_type: 'payment', // Default for now, could be derived from package or metadata
    transaction_status: updatedTransaction.status,
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
    package: updatedTransaction.package
      ? {
          id: updatedTransaction.package.id,
          name: updatedTransaction.package.name,
          slug: updatedTransaction.package.slug,
          description: updatedTransaction.package.description,
          pricing_tiers: updatedTransaction.package.pricing_tiers as Json,
          currency: updatedTransaction.package.currency || 'USD',
          billing_period: updatedTransaction.package.billing_period || 'monthly',
          features: updatedTransaction.package.features as Json,
        }
      : null,
    gateway: updatedTransaction.gateway
      ? {
          id: updatedTransaction.gateway.id,
          name: updatedTransaction.gateway.name,
          slug: updatedTransaction.gateway.slug,
        }
      : null,
    user: {
      user_id: updatedUserProfile.user_id,
      full_name: updatedUserProfile.full_name || 'Unknown',
      role: updatedUserProfile.role || 'user',
      email: 'N/A', // Email not available in profile join
      created_at: updatedUserProfile.created_at || new Date().toISOString(),
      package_id: updatedUserProfile.package_id,
      subscribed_at: ((updatedUserProfile as Record<string, unknown>).subscription_start_date ||
        (updatedUserProfile as Record<string, unknown>).subscribed_at) as string,
      expires_at: ((updatedUserProfile as Record<string, unknown>).subscription_end_date ||
        (updatedUserProfile as Record<string, unknown>).expires_at) as string,
      phone_number: updatedUserProfile.phone_number,
    },
    verifier: verifierProfile
      ? {
          user_id: verifierProfile.user_id,
          full_name: verifierProfile.full_name || 'Unknown',
          role: verifierProfile.role || 'admin',
        }
      : null,
  };

  // Log admin activity
  try {
    await ActivityLogger.logAdminAction(
      adminUser.id,
      'order_status_update',
      orderId,
      `Updated order ${currentTransaction.id} status from ${currentTransaction.status} to ${status}`,
      request,
      {
        previousStatus: currentTransaction.status,
        newStatus: status,
        orderId,
        customerId: currentTransaction.user_id,
        notes: notes || null,
        orderStatusUpdate: true,
      }
    );
  } catch (logError) {
    logger.error(
      { error: logError instanceof Error ? logError.message : String(logError) },
      'Failed to log admin activity:'
    );
  }

  // Log plan activation separately when order is completed
  if (status === 'completed') {
    try {
      await ActivityLogger.logAdminAction(
        adminUser.id,
        'plan_activation',
        currentTransaction.user_id,
        `Plan activated after payment confirmation for order ${currentTransaction.id}`,
        undefined,
        {
          packageId: currentTransaction.package_id,
          transactionId: currentTransaction.id,
          planActivation: true,
        }
      );
    } catch (logError) {
      logger.error(
        { error: logError instanceof Error ? logError.message : String(logError) },
        'Failed to log plan activation:'
      );
    }
  }

  return formatSuccess({
    message: `Order ${status === 'completed' ? 'approved' : 'rejected'} successfully${status === 'completed' ? ' and plan activated' : ''}`,
    transaction: finalTransaction,
  });
});
