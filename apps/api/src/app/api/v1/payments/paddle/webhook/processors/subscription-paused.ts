/**
 * Paddle Webhook Processor: subscription.paused
 * Handles subscription pause events
 */

import { supabaseAdmin } from '@indexnow/database';

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

    // Update subscription status to paused
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

    // Get subscription to update user profile
    const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id')
        .eq('paddle_subscription_id', subscription_id)
        .maybeSingle();

    if (fetchError) {
        throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
    }

    if (subscription) {
        // Set subscription_end_date to now to disable access
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
