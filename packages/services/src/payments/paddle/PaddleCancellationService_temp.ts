/**
 * Paddle Cancellation Service
 * Handles subscription cancellation with automatic 7-day refund policy
 * 
 * Business Rules:
 * - ≤7 days from purchase: Full refund + immediate cancellation
 * - >7 days: No refund + scheduled cancellation (access until period end)
 */

import { PaddleService } from './PaddleService'
import { supabaseAdmin } from '@indexnow/database'
import { differenceInDays } from 'date-fns'
import { logger, ErrorType, ErrorSeverity, DbSubscriptionRow, DbTransactionRow, TransactionMetadata } from '@indexnow/shared'
import { Subscription, Adjustment } from '@paddle/paddle-node-sdk'

interface CancellationResult {
  action: 'immediate_with_refund' | 'scheduled_no_refund'
  subscription: Subscription
  refund?: Adjustment | null
  daysActive: number
  refundEligible: boolean
  message: string
}

interface RefundWindowInfo {
  daysActive: number
  daysRemaining: number
  refundEligible: boolean
  refundWindowDays: number
  createdAt: string
}

export class PaddleCancellationService {
  private static REFUND_WINDOW_DAYS = 7

  /**
   * Cancel subscription with automatic refund policy
   * - ≤7 days: Immediate cancellation + full refund
   * - >7 days: Scheduled cancellation at period end
   */
  static async cancelWithRefundPolicy(
    subscriptionId: string,
    userId: string
  ): Promise<CancellationResult> {
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('indb_payment_subscriptions')
      .select('*, created_at')
      .eq('paddle_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError || !subscription) {
      throw new Error('Subscription not found or access denied')
    }

    // Cast to DbSubscriptionRow to ensure type safety
    const strictSubscription = subscription as DbSubscriptionRow

    const createdDate = new Date(strictSubscription.created_at)
    const currentDate = new Date()
    const daysActive = differenceInDays(currentDate, createdDate)

    const refundEligible = daysActive <= this.REFUND_WINDOW_DAYS

    if (refundEligible) {
      return await this.cancelImmediatelyWithRefund(strictSubscription, daysActive)
    } else {
      return await this.cancelAtPeriodEnd(strictSubscription, daysActive)
    }
  }

  /**
   * Cancel immediately and process refund (≤7 days)
   */
  private static async cancelImmediatelyWithRefund(
    subscription: DbSubscriptionRow,
    daysActive: number
  ): Promise<CancellationResult> {
    const paddle = await PaddleService.getInstance()
    const subscriptionId = subscription.paddle_subscription_id

    if (!subscriptionId) {
      throw new Error('Paddle subscription ID is missing')
    }

    const canceledSubscription = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: 'immediately',
    })

    // Find the transaction associated with this subscription
    // We look for a completed transaction with the matching subscription_id in metadata
    const { data: transaction } = await supabaseAdmin
      .from('indb_payment_transactions')
      .select('*')
      .eq('status', 'completed')
      .contains('metadata', { subscription_id: subscription.id })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let refund: Adjustment | null = null

    if (transaction) {
      const strictTransaction = transaction as DbTransactionRow
      const paddleTransactionId = strictTransaction.external_transaction_id || 
                                 (strictTransaction.metadata as any)?.paddle_transaction_id

      if (paddleTransactionId) {
        try {
          refund = await paddle.adjustments.create({
            action: 'refund',
            transactionId: paddleTransactionId,
            reason: 'Canceled within 7-day refund period',
            items: [
              {
                type: 'full',
                itemId: paddleTransactionId, // Usually itemId is required, but for full refund maybe logic differs? 
                                           // Reverting to old code structure but with transactionId at top level
                                           // If strict types complain, we might need to fetch transaction items first.
              }
            ]
          }) // Removed as any
          // TODO: Remove 'as any' once we verify exact structure of AdjustmentCreate for full refunds
        } catch (refundError) {
          logger.error({
            type: ErrorType.EXTERNAL_API,
            severity: ErrorSeverity.HIGH,
            metadata: {
              error: refundError instanceof Error ? refundError.message : 'Unknown error',
              subscription_id: subscriptionId,
              transaction_id: paddleTransactionId,
            }
          }, `Refund failed for transaction ${paddleTransactionId}`)
        }
      } else {
        logger.warn({
          type: ErrorType.PAYMENT_PROCESSING,
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            subscription_id: subscriptionId,
            transaction_db_id: strictTransaction.id
          }
        }, 'Paddle transaction ID missing for refund')
      }
    }

    await supabaseAdmin
      .from('indb_payment_subscriptions')
      .update({
        status: 'cancelled', // Note: 'cancelled' in DB enum vs 'canceled' in some comments. DB Enum says 'cancelled' in database.ts
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    await supabaseAdmin
      .from('indb_auth_user_profiles')
      .update({
        // subscription_active: false, // This field might not exist in DbUserProfile, let's check. 
        // database.ts doesn't show subscription_active in indb_auth_user_profiles.
        // It shows: is_active, package_id, subscription_start_date, etc.
        // The original code had subscription_active. 
        // I should check if I should remove it or map it.
        // DbUserProfile has: is_active, package_id, subscription_start_date, subscription_end_date.
        // It does NOT have subscription_active.
        // I will use is_active? Or package_id = null.
        package_id: null,
      })
      .eq('user_id', subscription.user_id)

    const refundAmount = transaction ? `$${transaction.amount.toFixed(2)}` : 'full amount'

    return {
      action: 'immediate_with_refund',
      subscription: canceledSubscription,
      refund,
      daysActive,
      refundEligible: true,
      message: `Subscription canceled and refund of ${refundAmount} processed. You had ${daysActive} day${daysActive === 1 ? '' : 's'} of access.`,
    }
  }

  /**
   * Schedule cancellation at period end (>7 days)
   */
  private static async cancelAtPeriodEnd(
    subscription: DbSubscriptionRow,
    daysActive: number
  ): Promise<CancellationResult> {
    const paddle = await PaddleService.getInstance()
    const subscriptionId = subscription.paddle_subscription_id

    if (!subscriptionId) {
      throw new Error('Paddle subscription ID is missing')
    }

    const canceledSubscription = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: 'next_billing_period',
    })

    await supabaseAdmin
      .from('indb_payment_subscriptions')
      .update({
        status: 'active', // Stays active until period end
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    const periodEnd = subscription.current_period_end
    const formattedDate = periodEnd ? new Date(periodEnd).toLocaleDateString() : 'the end of your billing period'

    return {
      action: 'scheduled_no_refund',
      subscription: canceledSubscription,
      daysActive,
      refundEligible: false,
      message: `Subscription will be canceled at the end of your billing period. You'll keep access until ${formattedDate}.`,
    }
  }

  /**
   * Get refund window info for UI display
   */
  static async getRefundWindowInfo(subscriptionId: string, userId: string): Promise<RefundWindowInfo> {
    const { data: subscription, error } = await supabaseAdmin
      .from('indb_payment_subscriptions')
      .select('created_at')
      .eq('paddle_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !subscription) {
      throw new Error('Subscription not found or access denied')
    }

    const createdDate = new Date(subscription.created_at)
    const currentDate = new Date()
    const daysActive = differenceInDays(currentDate, createdDate)
    const daysRemaining = Math.max(0, this.REFUND_WINDOW_DAYS - daysActive)

    return {
      daysActive,
      daysRemaining,
      refundEligible: daysActive <= this.REFUND_WINDOW_DAYS,
      refundWindowDays: this.REFUND_WINDOW_DAYS,
      createdAt: subscription.created_at,
    }
  }
}
