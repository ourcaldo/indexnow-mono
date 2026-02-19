/**
 * Paddle Webhook Processor: subscription.updated
 * Handles subscription update events (plan changes, status changes)
 */

import { supabaseAdmin, SecureServiceRoleWrapper, fromJson, type Json } from '@indexnow/database';
import { safeGet } from './utils';

interface SubscriptionItem {
  price?: {
    id?: string;
  };
}

interface PaddleUpdatedData {
  id: string;
  status?: string;
  items?: SubscriptionItem[];
  current_billing_period?: {
    starts_at: string;
    ends_at: string;
  };
  paused_at?: string;
}

// Valid status values from database schema
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing' | 'expired';

function mapPaddleStatus(status: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    canceled: 'cancelled',
    cancelled: 'cancelled',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    expired: 'expired',
  };
  return statusMap[status] || 'active';
}

export async function processSubscriptionUpdated(data: unknown) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data received');
  }

  const subData = data as PaddleUpdatedData;
  const subscription_id = subData.id;

  if (!subscription_id) {
    throw new Error('Missing subscription_id in update event');
  }

  const status = subData.status || 'active';
  const items = subData.items;
  const current_billing_period = subData.current_billing_period;
  const paused_at = subData.paused_at;

  const priceId =
    Array.isArray(items) && items.length > 0
      ? safeGet(fromJson<Record<string, unknown>>(items[0] as unknown as Json), 'price.id', null)
      : null;

  const updateData: Record<string, unknown> = {
    status: mapPaddleStatus(status),
    paddle_price_id: priceId,
    paused_at: paused_at || null,
    updated_at: new Date().toISOString(),
  };

  if (current_billing_period?.ends_at) {
    updateData.current_period_end = current_billing_period.ends_at;
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'update_subscription',
      reason: 'Paddle webhook subscription.updated event',
      source: 'webhook.processors.subscription-updated',
      metadata: { subscription_id, status },
    },
    {
      table: 'indb_payment_subscriptions',
      operationType: 'update',
      data: { status: mapPaddleStatus(status) },
      whereConditions: { paddle_subscription_id: subscription_id },
    },
    async () => {
      const { error: subscriptionError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update(updateData)
        .eq('paddle_subscription_id', subscription_id);

      if (subscriptionError) {
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }

      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id, id')
        .eq('paddle_subscription_id', subscription_id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
      }

      if (subscription && subscription.user_id) {
        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update({
            subscription_end_date:
              status === 'active'
                ? current_billing_period?.ends_at || null
                : new Date().toISOString(),
          })
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile: ${profileError.message}`);
        }
      }
    }
  );
}
