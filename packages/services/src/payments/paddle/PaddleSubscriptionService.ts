/**
 * Paddle Subscription Service
 * Handles subscription lifecycle management
 * 
 * ARCHITECTURE NOTE:
 * This service ONLY interacts with the Paddle API.
 * It DOES NOT update the local database.
 * Local database synchronization is handled exclusively by Webhooks
 * to ensure a Single Source of Truth and prevent Split Brain state.
 */

import { PaddleService } from './PaddleService'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared'

// Explicit type for subscription to avoid never type inference
interface SubscriptionRecord {
  id: string
  user_id: string
  package_id: string | null
  status: string
  start_date: string | null
  end_date: string | null
  canceled_at: string | null
  cancel_at_period_end: boolean
  paused_at: string | null
  current_period_end: string | null
  paddle_subscription_id: string | null
  paddle_price_id: string | null
  stripe_subscription_id: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

export class PaddleSubscriptionService {
  /**
   * Get subscription details from Paddle
   */
  static async getSubscription(subscriptionId: string) {
    const paddle = await PaddleService.getInstance()
    const subscription = await paddle.subscriptions.get(subscriptionId)
    return subscription
  }

  /**
   * Cancel a subscription immediately or at period end
   * Note: Database update will be handled by 'subscription.canceled' webhook
   */
  static async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<boolean> {
    const paddle = await PaddleService.getInstance()

    await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: immediately ? 'immediately' : 'next_billing_period',
    })

    return true
  }

  /**
   * Pause subscription
   * Note: Database update will be handled by 'subscription.paused' webhook
   */
  static async pauseSubscription(
    subscriptionId: string,
    options?: { effectiveFrom?: 'next_billing_period' | 'immediately' }
  ) {
    const paddle = await PaddleService.getInstance()

    const subscription = await paddle.subscriptions.pause(
      subscriptionId,
      options || {}
    )

    return subscription
  }

  /**
   * Resume paused subscription
   * Note: Database update will be handled by 'subscription.resumed' webhook
   */
  static async resumeSubscription(
    subscriptionId: string,
    effectiveFrom: 'next_billing_period' | 'immediately' = 'immediately'
  ) {
    const paddle = await PaddleService.getInstance()

    const subscription = await paddle.subscriptions.resume(
      subscriptionId,
      { effectiveFrom }
    )

    return subscription
  }

  /**
   * Update subscription (e.g., change plan)
   * Note: Database update will be handled by 'subscription.updated' webhook
   */
  static async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ) {
    const paddle = await PaddleService.getInstance()

    const subscription = await paddle.subscriptions.update(subscriptionId, {
      items: [
        {
          priceId: newPriceId,
          quantity: 1,
        },
      ],
    })

    return subscription
  }

  /**
   * Get subscription from database by user ID
   * READ-ONLY Operation
   */
  static async getSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null> {
    return SecureServiceRoleWrapper.executeSecureOperation<SubscriptionRecord | null>(
      {
        userId,
        operation: 'get_subscription_by_user_id',
        reason: 'Fetching active subscription for user',
        source: 'PaddleSubscriptionService',
        metadata: { userId }
      },
      { table: 'indb_payment_subscriptions', operationType: 'select' },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_subscriptions')
          .select('id, user_id, package_id, status, start_date, end_date, canceled_at, cancel_at_period_end, paused_at, current_period_end, paddle_subscription_id, paddle_price_id, stripe_subscription_id, cancel_reason, created_at, updated_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        if (error) {
          // PGRST116 means no rows - not an error condition
          if (error.code === 'PGRST116') {
            return null
          }
          throw ErrorHandlingService.createError({ message: `Failed to get subscription for user: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH })
        }

        return data as SubscriptionRecord
      }
    )
  }
}

