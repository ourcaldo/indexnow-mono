/**
 * Paddle Webhook Processor: subscription.resumed
 * Handles subscription resume events
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';

interface PaddleResumedData {
  id: string;
  current_billing_period?: {
    ends_at: string;
  };
}

export async function processSubscriptionResumed(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddleResumedData;
  const subscription_id = subData.id;
  const current_billing_period = subData.current_billing_period;

  if (!subscription_id) {
    throw new Error('Missing subscription_id in resume event');
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'resume_subscription',
      reason: 'Paddle webhook subscription.resumed event',
      source: 'webhook.processors.subscription-resumed',
      metadata: { subscription_id },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: 'active', paused_at: null },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
          status: 'active',
          paused_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription resume: ${subscriptionError.message}`);
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
            subscription_end_date: current_billing_period?.ends_at || null,
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile on resume: ${profileError.message}`);
        }
      }
    }
  );
}
