/**
 * Paddle Webhook Processor: subscription.trialing
 * Handles subscription trial period events.
 *
 * Fires when a subscription enters a Paddle-configured trial period.
 * The subscription status is "trialing" — no payment has been collected yet.
 * When the trial ends, Paddle charges the customer and fires subscription.activated.
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { validateCustomData } from './utils';
import { backfillPaddleCustomerId } from './utils';

interface TrialDates {
  starts_at: string;
  ends_at: string;
}

interface PaddleTrialingData {
  id: string;
  customer_id?: string;
  custom_data?: unknown;
  current_billing_period?: {
    starts_at: string;
    ends_at: string;
  } | null;
  items?: Array<{
    trial_dates?: TrialDates | null;
  }>;
}

export async function processSubscriptionTrialing(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddleTrialingData;
  const subscription_id = subData.id;

  if (!subscription_id) {
    throw new Error('Missing subscription_id in trialing event');
  }

  // Trial dates are on the first item
  const trialDates = subData.items?.[0]?.trial_dates ?? null;

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'set_subscription_trialing',
      reason: 'Paddle webhook subscription.trialing event',
      source: 'webhook.processors.subscription-trialing',
      metadata: { subscription_id, trialEndsAt: trialDates?.ends_at ?? null },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: 'trialing' },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
          status: 'trialing',
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription to trialing: ${subscriptionError.message}`);
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
        const trialEnd = trialDates?.ends_at ?? subData.current_billing_period?.ends_at ?? null;

        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update({
            is_trial_active: true,
            trial_ends_at: trialEnd,
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile for trial: ${profileError.message}`);
        }

        // Backfill paddle_customer_id if missing
        await backfillPaddleCustomerId(subscription.user_id, subData.customer_id);
      }
    }
  );
}
