/**
 * Get User's Subscription API
 * Returns the user's current subscription details (both Paddle and legacy)
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { type Database , getClientIP} from '@indexnow/shared';
import { authenticatedApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];

// Selected subscription fields
type SubscriptionSelect = Pick<PaymentSubscriptionRow,
    'id' | 'paddle_subscription_id' | 'status' | 'package_id' | 'start_date' |
    'current_period_end' | 'cancel_at_period_end' | 'canceled_at' | 'paused_at' | 'created_at'
>;

// Selected user profile fields
type UserProfileSelect = Pick<UserProfileRow, 'package_id' | 'subscription_start_date' | 'subscription_end_date'>;

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
    // First, check for Paddle subscription using SecureServiceRoleWrapper
    const paddleSubscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionSelect | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'get_paddle_subscription',
            source: 'paddle/subscription/my-subscription',
            reason: 'User fetching their active Paddle subscription',
            metadata: { endpoint: '/api/v1/payments/paddle/subscription/my-subscription' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .select('id, paddle_subscription_id, status, package_id, start_date, current_period_end, cancel_at_period_end, canceled_at, paused_at, created_at')
                .eq('user_id', auth.userId)
                .in('status', ['active', 'past_due', 'paused'])
                .maybeSingle();

            if (error) throw new Error(`Failed to fetch Paddle subscription: ${error.message}`);
            return data;
        }
    );

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
    const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<UserProfileSelect | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'get_user_legacy_subscription',
            source: 'paddle/subscription/my-subscription',
            reason: 'User fetching their legacy subscription from profile',
            metadata: { endpoint: '/api/v1/payments/paddle/subscription/my-subscription' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_auth_user_profiles', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_auth_user_profiles')
                .select('package_id, subscription_start_date, subscription_end_date')
                .eq('user_id', auth.userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch user profile: ${error.message}`);
            }
            return data;
        }
    );

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
