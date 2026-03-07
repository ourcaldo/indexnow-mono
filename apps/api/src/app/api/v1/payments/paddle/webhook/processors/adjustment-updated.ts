/**
 * Paddle Webhook Processor: adjustment.updated
 * Handles adjustment status updates — primarily refund approvals/rejections.
 *
 * Refunds require Paddle approval and start as "pending_approval".
 * This event fires when status moves to "approved" or "rejected".
 *
 * On approved refund:
 * - Marks transaction as refunded
 * - For full refunds: cancels subscription and revokes user access
 *
 * On rejected refund:
 * - Logs the rejection, no DB changes to transaction status
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';
import { backfillPaddleCustomerId } from './utils';

interface AdjustmentTotals {
  total?: string;
  subtotal?: string;
  tax?: string;
}

interface PaddleAdjustmentData {
  id: string;
  action: string; // refund, credit, chargeback, chargeback_warning
  type?: string; // full, partial
  transaction_id: string;
  subscription_id?: string | null;
  customer_id: string;
  reason: string;
  status: string; // pending_approval, approved, rejected
  totals?: AdjustmentTotals;
  updated_at?: string;
}

export async function processAdjustmentUpdated(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid adjustment data received');
  }

  const adjData = data as PaddleAdjustmentData;
  const {
    id: adjustment_id,
    action,
    type: adjustmentType,
    transaction_id,
    subscription_id,
    customer_id,
    reason,
    status,
    totals,
  } = adjData;

  if (!adjustment_id || !transaction_id) {
    throw new Error('Missing required fields: adjustment_id or transaction_id');
  }

  // Only process approved refunds/credits/chargebacks
  if (status === 'rejected') {
    logger.info({
      type: ErrorType.BUSINESS_LOGIC,
      severity: ErrorSeverity.LOW,
      adjustment_id,
      action,
      status: 'rejected',
      transaction_id,
      reason,
    });
    return;
  }

  if (status !== 'approved') {
    return;
  }

  const isRefund = action === 'refund';
  const isChargeback = action === 'chargeback';
  const isFullRefund = adjustmentType === 'full';
  const refundedAt = new Date().toISOString();

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'process_adjustment_approved',
      reason: `Paddle webhook adjustment.updated — ${action} approved`,
      source: 'webhook.processors.adjustment-updated',
      metadata: {
        adjustment_id,
        action,
        type: adjustmentType || 'partial',
        transaction_id,
        subscription_id: subscription_id || null,
        total: totals?.total || '0',
        reason,
      },
    },
    {
      table: 'indb_paddle_transactions',
      operationType: 'update',
      data: { status: 'refunded' },
      whereConditions: { paddle_transaction_id: transaction_id },
    },
    async () => {
      // Update paddle transaction with refund status
      const { error: updatePaddleError } = await supabaseAdmin
        .from('indb_paddle_transactions')
        .update({
          status: 'refunded',
          event_type: 'adjustment.updated',
          event_data: {
            adjustment_id,
            action,
            type: adjustmentType || 'partial',
            status: 'approved',
            reason,
            total: totals?.total || '0',
            refunded_at: refundedAt,
          },
          updated_at: refundedAt,
        })
        .eq('paddle_transaction_id', transaction_id);

      if (updatePaddleError) {
        throw new Error(
          `Failed to update Paddle transaction refund status: ${updatePaddleError.message}`
        );
      }

      // Look up the main transaction record
      const { data: paddleTx, error: fetchPaddleError } = await supabaseAdmin
        .from('indb_paddle_transactions')
        .select('transaction_id')
        .eq('paddle_transaction_id', transaction_id)
        .maybeSingle();

      if (fetchPaddleError) {
        throw new Error(`Failed to fetch paddle transaction: ${fetchPaddleError.message}`);
      }

      if (paddleTx?.transaction_id) {
        // Update main transaction status
        const { error: updateMainError } = await supabaseAdmin
          .from('indb_payment_transactions')
          .update({
            status: 'refunded',
            notes: `${action}: ${reason}`,
            updated_at: refundedAt,
          })
          .eq('id', paddleTx.transaction_id);

        if (updateMainError) {
          throw new Error(
            `Failed to update main transaction refund status: ${updateMainError.message}`
          );
        }

        // For full refunds or chargebacks: revoke subscription access
        if ((isRefund || isChargeback) && isFullRefund && subscription_id) {
          const { data: mainTx } = await supabaseAdmin
            .from('indb_payment_transactions')
            .select('user_id, amount')
            .eq('id', paddleTx.transaction_id)
            .maybeSingle();

          if (mainTx) {
            const { error: subscriptionError } = await supabaseAdmin
              .from('indb_payment_subscriptions')
              .update({
                status: 'cancelled',
                cancelled_at: refundedAt,
                updated_at: refundedAt,
              })
              .eq('paddle_subscription_id', subscription_id);

            if (subscriptionError) {
              throw new Error(
                `Failed to cancel subscription after refund: ${subscriptionError.message}`
              );
            }

            if (mainTx.user_id) {
              const { error: profileError } = await supabaseAdmin
                .from('indb_auth_user_profiles')
                .update({
                  subscription_end_date: refundedAt,
                  package_id: null,
                })
                .eq('user_id', mainTx.user_id);

              if (profileError) {
                throw new Error(
                  `Failed to revoke user access after refund: ${profileError.message}`
                );
              }
            }

            logger.info({
              type: ErrorType.BUSINESS_LOGIC,
              severity: ErrorSeverity.MEDIUM,
              adjustment_id,
              action,
              transaction_id,
              subscription_id,
              is_full_refund: true,
              user_id: mainTx.user_id,
              reason,
            });
          }
        }

        // Backfill paddle_customer_id if missing
        if (customer_id) {
          const { data: mainTx } = await supabaseAdmin
            .from('indb_payment_transactions')
            .select('user_id')
            .eq('id', paddleTx.transaction_id)
            .maybeSingle();

          if (mainTx?.user_id) {
            await backfillPaddleCustomerId(mainTx.user_id, customer_id);
          }
        }
      }
    }
  );
}
