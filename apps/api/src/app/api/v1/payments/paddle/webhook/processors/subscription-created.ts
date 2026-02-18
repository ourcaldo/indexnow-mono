/**
 * Paddle Webhook Processor: subscription.created
 * Handles new subscription creation events
 */

import { supabaseAdmin, SecureServiceRoleWrapper, fromJson } from '@indexnow/database';
import { validateCustomData, safeGet } from './utils';

// Type for subscription data from Paddle
interface SubscriptionItem {
    price: {
        id: string;
    };
}

interface PaddleSubscriptionData {
    id: string;
    customer_id: string;
    items: SubscriptionItem[];
    custom_data: unknown;
    current_billing_period: {
        starts_at: string;
        ends_at: string;
    };
}

export async function processSubscriptionCreated(data: unknown) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid subscription data received');
    }

    const subData = data as PaddleSubscriptionData;
    const subscription_id = subData.id;
    const customer_id = subData.customer_id;
    const items = subData.items;
    const custom_data = subData.custom_data;
    const current_billing_period = subData.current_billing_period;

    if (!subscription_id || !customer_id) {
        throw new Error('Missing required fields: subscription_id or customer_id');
    }

    const validatedData = validateCustomData(custom_data, subscription_id);
    if (!validatedData || !validatedData.userId) {
        throw new Error('Invalid or missing custom_data with userId');
    }

    const userId = validatedData.userId;
    const packageSlug = validatedData.packageSlug;

    if (!packageSlug) {
        throw new Error('Missing packageSlug in custom_data');
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Missing or invalid items array in subscription');
    }

    const priceId = safeGet(fromJson<Record<string, unknown>>(items[0]), 'price.id', null);
    if (!priceId) {
        throw new Error('Missing price ID in subscription items');
    }

    if (!current_billing_period?.starts_at || !current_billing_period?.ends_at) {
        throw new Error('Missing or invalid current_billing_period');
    }

    await SecureServiceRoleWrapper.executeSecureOperation(
        {
            userId,
            operation: 'create_subscription',
            reason: 'Paddle webhook subscription.created event',
            source: 'webhook.processors.subscription-created',
            metadata: { subscription_id, customer_id, packageSlug },
        },
        {
            table: 'indb_payment_subscriptions',
            operationType: 'insert',
            data: { user_id: userId, paddle_subscription_id: subscription_id, status: 'active' },
        },
        async () => {
            const { data: packageData, error: packageError } = await supabaseAdmin
                .from('indb_payment_packages')
                .select('*')
                .eq('slug', packageSlug)
                .is('deleted_at', null)
                .single();

            if (packageError || !packageData) {
                throw new Error(`Failed to fetch package data for ${packageSlug}: ${packageError?.message || 'not found'}`);
            }

            const { data: subscription, error: subscriptionError } = await supabaseAdmin
                .from('indb_payment_subscriptions')
                .insert({
                    user_id: userId,
                    paddle_subscription_id: subscription_id,
                    status: 'active',
                    package_id: packageData.id,
                    paddle_price_id: priceId,
                    start_date: current_billing_period.starts_at,
                    current_period_end: current_billing_period.ends_at,
                })
                .select()
                .single();

            if (subscriptionError || !subscription) {
                throw new Error(`Failed to create subscription record: ${subscriptionError?.message || 'unknown error'}`);
            }

            const { error: profileError } = await supabaseAdmin
                .from('indb_auth_user_profiles')
                .update({
                    package_id: packageData.id,
                    subscription_start_date: current_billing_period.starts_at,
                    subscription_end_date: current_billing_period.ends_at,
                })
                .eq('user_id', userId);

            if (profileError) {
                throw new Error(`Failed to update user profile: ${profileError.message}`);
            }
        }
    );
}
