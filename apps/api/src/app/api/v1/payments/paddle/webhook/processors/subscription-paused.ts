/**
 * Paddle Webhook Processor: subscription.paused
 * Handles subscription pause events
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';

interface PaddlePausedData {
  id: string;
  paused_at?: string;
}

export async function processSubscriptionPaused(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddlePausedData;
  const subscription_id = subData.id;
  const paused_at = subData.paused_at;

  if (!subscription_id) {
    throw new Error('Missing subscription_id in pause event');
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'pause_subscription',
      reason: 'Paddle webhook subscription.paused event',
      source: 'webhook.processors.subscription-paused',
      metadata: { subscription_id },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: 'paused' },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
          status: 'paused',
          paused_at: paused_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription pause: ${subscriptionError.message}`);
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
        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update({
            subscription_end_date: new Date().toISOString(),
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile on pause: ${profileError.message}`);
        }
      }
    }
  );
}
