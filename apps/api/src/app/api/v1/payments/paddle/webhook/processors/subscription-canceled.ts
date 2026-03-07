/**
 * Paddle Webhook Processor: subscription.canceled
 * Handles subscription cancellation events.
 *
 * When this event fires, the cancellation has ALREADY taken effect —
 * status is "canceled" and current_billing_period is null.
 * Use canceled_at as the subscription end date.
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { backfillPaddleCustomerId } from './utils';

interface PaddleCanceledData {
  id: string;
  customer_id?: string;
  canceled_at?: string;
}

export async function processSubscriptionCanceled(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddleCanceledData;
  const subscription_id = subData.id;
  const canceled_at = subData.canceled_at || new Date().toISOString();

  if (!subscription_id) {
    throw new Error('Missing subscription_id in cancel event');
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'cancel_subscription',
      reason: 'Paddle webhook subscription.canceled event',
      source: 'webhook.processors.subscription-canceled',
      metadata: { subscription_id, canceled_at },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: 'cancelled' },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
          status: 'cancelled',
          canceled_at,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription cancellation: ${subscriptionError.message}`);
      }

      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id')
        .eq('paddle_subscription_id', subscription_id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      if (subscription && subscription.user_id) {
        // Use canceled_at as end date — current_billing_period is null for canceled subs
        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update({
            subscription_end_date: canceled_at,
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile on cancellation: ${profileError.message}`);
        }
      }

      // Backfill paddle_customer_id if missing
      if (subscription?.user_id) {
        await backfillPaddleCustomerId(subscription.user_id, subData.customer_id);
      }
    }
  );
}
