/**
 * Paddle Webhook Processor: adjustment.created
 * Handles adjustment creation events (refunds, credits, chargebacks).
 *
 * When a refund is requested, Paddle creates an adjustment with status
 * "pending_approval". Credits may be auto-approved. This processor logs
 * the adjustment for audit purposes; actual refund processing happens
 * in adjustment-updated when status moves to "approved".
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
  created_at?: string;
}

export async function processAdjustmentCreated(data: unknown) {
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

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'process_adjustment_created',
      reason: `Paddle webhook adjustment.created — ${action} (${status})`,
      source: 'webhook.processors.adjustment-created',
      metadata: {
        adjustment_id,
        action,
        type: adjustmentType || 'partial',
        transaction_id,
        subscription_id: subscription_id || null,
        status,
        total: totals?.total || '0',
        reason,
      },
    },
    {
      table: 'indb_paddle_transactions',
      operationType: 'update',
      data: { event_type: 'adjustment.created' },
      whereConditions: { paddle_transaction_id: transaction_id },
    },
    async () => {
      // Log the adjustment event against the paddle transaction record
      const { error: updateError } = await supabaseAdmin
        .from('indb_paddle_transactions')
        .update({
          event_type: 'adjustment.created',
          event_data: {
            adjustment_id,
            action,
            type: adjustmentType || 'partial',
            status,
            reason,
            total: totals?.total || '0',
            created_at: adjData.created_at || new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_transaction_id', transaction_id);

      if (updateError) {
        throw new Error(`Failed to log adjustment on paddle transaction: ${updateError.message}`);
      }

      logger.info({
        type: ErrorType.BUSINESS_LOGIC,
        severity: ErrorSeverity.LOW,
        adjustment_id,
        action,
        status,
        transaction_id,
        total: totals?.total || '0',
        reason,
      });

      // Backfill paddle_customer_id if missing
      if (customer_id) {
        const { data: paddleTx } = await supabaseAdmin
          .from('indb_paddle_transactions')
          .select('transaction_id')
          .eq('paddle_transaction_id', transaction_id)
          .maybeSingle();

        if (paddleTx?.transaction_id) {
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
