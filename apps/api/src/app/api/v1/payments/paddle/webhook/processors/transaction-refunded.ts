/**
 * Paddle Webhook Processor: transaction.refunded
 * Handles refund events for transactions
 * 
 * Architecture: 2-Table Pattern
 * 1. Update Paddle-specific table (indb_paddle_transactions) with refund status
 * 2. Update main transaction table (indb_payment_transactions) status to 'refunded'
 * 
 * Business Impact:
 * - Updates transaction status to reflect refund
 * - For full refunds: immediately revokes subscription access
 * - Logs refund for audit trail and financial reconciliation
 */

import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

interface RefundAdjustment {
    total?: string;
    reason?: string;
}

interface PaddleRefundData {
    id: string;
    subscription_id?: string;
    adjustment?: RefundAdjustment;
}

export async function processTransactionRefunded(data: unknown) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid transaction data received');
    }

    const txData = data as PaddleRefundData;
    const paddle_transaction_id = txData.id;
    const subscription_id = txData.subscription_id;
    const refund_amount = txData.adjustment?.total || '0';
    const refund_reason = txData.adjustment?.reason || 'unknown';

    if (!paddle_transaction_id) {
        throw new Error('Missing transaction_id in refund event');
    }

    const refundedAt = new Date().toISOString();

    // 1. Get the paddle transaction to find the main transaction_id
    const { data: paddleTransaction, error: fetchPaddleError } = await supabaseAdmin
        .from('indb_paddle_transactions')
        .select('transaction_id')
        .eq('paddle_transaction_id', paddle_transaction_id)
        .maybeSingle();

    if (fetchPaddleError) {
        throw new Error(`Failed to fetch paddle transaction: ${fetchPaddleError.message}`);
    }

    // 2. Update paddle transactions table with refund status
    const { error: updatePaddleError } = await supabaseAdmin
        .from('indb_paddle_transactions')
        .update({
            status: 'refunded',
            event_type: 'transaction.refunded',
            event_data: {
                refund_amount,
                refund_reason,
                refunded_at: refundedAt
            },
            updated_at: refundedAt,
        })
        .eq('paddle_transaction_id', paddle_transaction_id);

    if (updatePaddleError) {
        throw new Error(`Failed to update Paddle transaction refund status: ${updatePaddleError.message}`);
    }

    // 3. Update main payment transactions table if we have the transaction_id
    if (paddleTransaction?.transaction_id) {
        const { error: updateMainError } = await supabaseAdmin
            .from('indb_payment_transactions')
            .update({
                status: 'refunded',
                notes: `Refund: ${refund_reason}`,
                updated_at: refundedAt
            })
            .eq('id', paddleTransaction.transaction_id);

        if (updateMainError) {
            throw new Error(`Failed to update main transaction refund status: ${updateMainError.message}`);
        }

        // Get user_id and amount from main transaction for full refund check
        const { data: mainTransaction, error: fetchMainError } = await supabaseAdmin
            .from('indb_payment_transactions')
            .select('user_id, amount')
            .eq('id', paddleTransaction.transaction_id)
            .maybeSingle();

        if (fetchMainError) {
            throw new Error(`Failed to fetch main transaction: ${fetchMainError.message}`);
        }

        // 4. For full refunds of subscription payments, revoke access
        if (subscription_id && mainTransaction) {
            const refundAmountNum = parseFloat(refund_amount) / 100;
            const isFullRefund = refundAmountNum >= Number(mainTransaction.amount);

            if (isFullRefund) {
                const { error: subscriptionError } = await supabaseAdmin
                    .from('indb_payment_subscriptions')
                    .update({
                        status: 'cancelled',
                        cancelled_at: refundedAt,
                        updated_at: refundedAt,
                    })
                    .eq('paddle_subscription_id', subscription_id);

                if (subscriptionError) {
                    throw new Error(`Failed to cancel subscription after refund: ${subscriptionError.message}`);
                }

                // Update user profile - clear subscription end date
                const { error: profileError } = await supabaseAdmin
                    .from('indb_auth_user_profiles')
                    .update({
                        subscription_end_date: refundedAt,
                        package_id: null,
                    })
                    .eq('user_id', mainTransaction.user_id);

                if (profileError) {
                    throw new Error(`Failed to revoke user access after refund: ${profileError.message}`);
                }
            }

            // Log refund event (using console since ErrorHandlingService has complex dependencies)
            console.log('[REFUND]', {
                type: ErrorType.BUSINESS_LOGIC,
                severity: ErrorSeverity.LOW,
                paddle_transaction_id,
                refund_amount: refundAmountNum,
                refund_reason,
                is_full_refund: isFullRefund,
                user_id: mainTransaction.user_id,
            });
        }
    }
}
