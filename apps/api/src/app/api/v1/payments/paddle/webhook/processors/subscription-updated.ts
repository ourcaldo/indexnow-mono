/**
 * Paddle Webhook Processor: subscription.updated
 * Handles subscription update events (plan changes, status changes).
 * When the price changes (upgrade/downgrade), resolves the new package
 * and updates both indb_payment_subscriptions.package_id and
 * indb_auth_user_profiles.package_id so the UI reflects the new plan.
 */

import { supabaseAdmin, SecureServiceRoleWrapper, fromJson, type Json } from '@indexnow/database';
import type { PricingTierDetails } from '@indexnow/shared';
import { safeGet } from './utils';
import { logger } from '@/lib/monitoring/error-handling';

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

/**
 * Finds the package whose pricing_tiers JSON contains a matching paddle_price_id.
 * Returns the package id or null if no match is found.
 */
async function resolvePackageIdFromPriceId(priceId: string): Promise<string | null> {
  const { data: packages, error } = await supabaseAdmin
    .from('indb_payment_packages')
    .select('id, pricing_tiers')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error || !packages) {
    logger.warn({ priceId, error: error?.message }, 'Failed to fetch packages for price ID resolution');
    return null;
  }

  for (const pkg of packages) {
    const tiers = pkg.pricing_tiers;
    if (!tiers || typeof tiers !== 'object') continue;

    // pricing_tiers is Record<string, PricingTierDetails> (e.g. { monthly: {...}, annual: {...} })
    const tierEntries = Object.values(tiers) as PricingTierDetails[];
    for (const tier of tierEntries) {
      if (tier && tier.paddle_price_id === priceId) {
        return pkg.id;
      }
    }
  }

  logger.warn({ priceId }, 'No package found matching paddle_price_id — plan mapping may be missing');
  return null;
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

  // Resolve which package this price belongs to (for plan changes)
  const newPackageId = priceId ? await resolvePackageIdFromPriceId(priceId) : null;

  const subscriptionUpdate: Record<string, unknown> = {
    status: mapPaddleStatus(status),
    paddle_price_id: priceId,
    paused_at: paused_at || null,
    updated_at: new Date().toISOString(),
  };

  if (current_billing_period?.ends_at) {
    subscriptionUpdate.current_period_end = current_billing_period.ends_at;
  }

  if (newPackageId) {
    subscriptionUpdate.package_id = newPackageId;
  }

  await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'update_subscription',
      reason: 'Paddle webhook subscription.updated event',
      source: 'webhook.processors.subscription-updated',
      metadata: { subscription_id, status, newPackageId },
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
        .update(subscriptionUpdate)
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
        const profileUpdate: Record<string, unknown> = {
          subscription_end_date:
            status === 'active'
              ? current_billing_period?.ends_at || null
              : new Date().toISOString(),
        };

        // Update the user's active package when the plan changed
        if (newPackageId) {
          profileUpdate.package_id = newPackageId;
          logger.info(
            { userId: subscription.user_id, newPackageId, priceId },
            'Updating user profile package_id after plan change'
          );
        }

        const { error: profileError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update(profileUpdate)
          .eq('user_id', subscription.user_id);

        if (profileError) {
          throw new Error(`Failed to update user profile: ${profileError.message}`);
        }
      }
    }
  );
}
