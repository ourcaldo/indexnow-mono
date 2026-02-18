/**
 * Paddle Webhook Processor: subscription.past_due
 * Handles subscription past_due events (payment failure)
 *
 * Business Impact:
 * - Prevents users from accessing premium features when payment fails
 * - Triggers error logging for admin monitoring
 * - Keeps subscription record for potential recovery when payment succeeds
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';

interface PaddlePastDueData {
  id: string;
  current_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
}

export async function processSubscriptionPastDue(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddlePastDueData;
  const subscription_id = subData.id;
  const current_billing_period = subData.current_billing_period;

  if (!subscription_id) {
    throw new Error('Missing subscription_id in past_due event');
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'mark_subscription_past_due',
      reason: 'Paddle webhook subscription.past_due event',
      source: 'webhook.processors.subscription-past-due',
      metadata: { subscription_id },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: 'past_due' },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription to past_due: ${subscriptionError.message}`);
      }

      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id, package_id')
        .eq('paddle_subscription_id', subscription_id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      if (subscription) {
        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update({
            subscription_end_date: new Date().toISOString(),
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to disable user access: ${profileError.message}`);
        }

        logger.info({
          type: ErrorType.EXTERNAL_API,
          severity: ErrorSeverity.HIGH,
          subscription_id,
          user_id: subscription.user_id,
          package_id: subscription.package_id,
          next_billing_period: current_billing_period,
        });
      }
    }
  );
}
