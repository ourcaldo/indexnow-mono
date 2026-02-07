/**
 * Get User's Subscription API
 * Returns the user's current subscription details (both Paddle and legacy)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { authenticatedApiWrapper, formatSuccess } from '../../../../../../../lib/core/api-response-middleware';

interface SubscriptionData {
    id: string;
    paddle_subscription_id: string | null;
    status: string;
    package_id: string | null;
    start_date: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    paused_at: string | null;
    created_at: string;
    subscription_type: 'paddle' | 'legacy';
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    // First, check for Paddle subscription
    const { data: paddleSubscription, error: paddleError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('*')
        .eq('user_id', auth.userId)
        .in('status', ['active', 'past_due', 'paused'])
        .maybeSingle();

    if (paddleError) {
        throw new Error(`Failed to fetch Paddle subscription: ${paddleError.message}`);
    }

    if (paddleSubscription) {
        const subscriptionData: SubscriptionData = {
            id: paddleSubscription.id,
            paddle_subscription_id: paddleSubscription.paddle_subscription_id,
            status: paddleSubscription.status,
            package_id: paddleSubscription.package_id,
            start_date: paddleSubscription.start_date,
            current_period_end: paddleSubscription.current_period_end,
            cancel_at_period_end: paddleSubscription.cancel_at_period_end ?? false,
            canceled_at: paddleSubscription.canceled_at,
            paused_at: paddleSubscription.paused_at,
            created_at: paddleSubscription.created_at,
            subscription_type: 'paddle',
        };

        return formatSuccess({
            subscription: subscriptionData,
            hasSubscription: true,
        });
    }

    // If no Paddle subscription, check for legacy subscription from user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('indb_auth_user_profiles')
        .select('package_id, subscription_start_date, subscription_end_date')
        .eq('user_id', auth.userId)
        .single();

    if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    // Check if user has an active legacy subscription
    if (userProfile?.package_id && userProfile?.subscription_end_date) {
        const endDate = new Date(userProfile.subscription_end_date);
        const now = new Date();
        const isActive = endDate > now;

        if (isActive) {
            const legacySubscription: SubscriptionData = {
                id: userProfile.package_id,
                paddle_subscription_id: null,
                status: 'active',
                package_id: userProfile.package_id,
                start_date: userProfile.subscription_start_date || new Date().toISOString(),
                current_period_end: userProfile.subscription_end_date,
                cancel_at_period_end: false,
                canceled_at: null,
                paused_at: null,
                created_at: userProfile.subscription_start_date || new Date().toISOString(),
                subscription_type: 'legacy',
            };

            return formatSuccess({
                subscription: legacySubscription,
                hasSubscription: true,
            });
        }
    }

    // No subscription found
    return formatSuccess({
        subscription: null as SubscriptionData | null,
        hasSubscription: false,
    });
});
