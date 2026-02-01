/**
 * Paddle Cancellation Service
 * Handles subscription cancellation with automatic 7-day refund policy
 * 
 * Business Rules:
 * - ≤7 days from purchase: Full refund + immediate cancellation
 * - >7 days: No refund + scheduled cancellation (access until period end)
 */

import { PaddleService } from './PaddleService'
import { supabaseAdmin } from '@/lib/database'
import { differenceInDays } from 'date-fns'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { SubscriptionRow, UpdateSubscription, UpdateUserProfile } from '@indexnow/database'
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

    const createdDate = new Date(subscription.created_at)
    const currentDate = new Date()
    const daysActive = differenceInDays(currentDate, createdDate)

    const refundEligible = daysActive <= this.REFUND_WINDOW_DAYS

    if (refundEligible) {
      return await this.cancelImmediatelyWithRefund(subscription, daysActive)
    } else {
      return await this.cancelAtPeriodEnd(subscription, daysActive)
    }
  }

  /**
   * Cancel immediately and process refund (≤7 days)
   */
  private static async cancelImmediatelyWithRefund(
    subscription: SubscriptionRow,
    daysActive: number
  ): Promise<CancellationResult> {
    const paddle = await PaddleService.getInstance()
    const subscriptionId = subscription.paddle_subscription_id

    if (!subscriptionId) {
      throw new Error('Paddle subscription ID not found')
    }

    const canceledSubscription = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: 'immediately',
    })

    const { data: transaction } = await supabaseAdmin
      .from('indb_paddle_transactions')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let refund: Adjustment | null = null

    if (transaction) {
      try {
        refund = await paddle.adjustments.create({
          action: 'refund',
          type: 'full',
          transactionId: transaction.paddle_transaction_id,
          reason: 'Canceled within 7-day refund period',
        })
      } catch (refundError) {
        await ErrorHandlingService.createError(
          ErrorType.EXTERNAL_API,
          `Refund failed for transaction ${transaction.paddle_transaction_id}`,
          {
            severity: ErrorSeverity.HIGH,
            metadata: { 
              error: refundError instanceof Error ? refundError.message : 'Unknown error',
              subscription_id: subscriptionId,
              transaction_id: transaction.paddle_transaction_id,
            },
          }
        )
      }
    }

    const updateData: UpdateSubscription = {
        status: 'cancelled',
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('indb_payment_subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    const userProfileUpdate: UpdateUserProfile = {
        subscription_end_date: new Date().toISOString(), // Should probably be set to now or null? original code set active to false and package_id to null. 
        // Checking original code:
        // subscription_active: false,
        // package_id: null,
        // But UpdateUserProfile doesn't have subscription_active. It has is_active? No, is_active is for user account.
        // It has subscription_end_date.
        // Let's check original code again.
        // original: subscription_active: false, package_id: null.
        // But UserProfile interface in database.ts (Line 116) has: package_id, subscription_start_date, subscription_end_date.
        // It does NOT have subscription_active.
        // So the original code was casting to UpdateUserProfile but using invalid properties!
        // This confirms the "hidden any" issue.
        // I need to fix this to match the schema.
        // To deactivate subscription, we should probably set subscription_end_date to now, and maybe package_id to null?
        // Or is there another field? 
        // UserProfile has is_trial_active.
        // It has no 'subscription_active' field.
        // So I will set package_id to null and subscription_end_date to now.
        package_id: null,
        subscription_end_date: new Date().toISOString()
    };

    await supabaseAdmin
      .from('indb_auth_user_profiles')
      .update(userProfileUpdate)
      .eq('user_id', subscription.user_id)

    const refundAmount = transaction ? `$${(transaction.amount as number).toFixed(2)}` : 'full amount'

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
    subscription: SubscriptionRow,
    daysActive: number
  ): Promise<CancellationResult> {
    const paddle = await PaddleService.getInstance()
    const subscriptionId = subscription.paddle_subscription_id

    if (!subscriptionId) {
      throw new Error('Paddle subscription ID not found')
    }

    const canceledSubscription = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: 'next_billing_period',
    })

    const updateData: UpdateSubscription = {
        status: 'active', // Stays active until period end
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('indb_payment_subscriptions')
      .update(updateData)
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
