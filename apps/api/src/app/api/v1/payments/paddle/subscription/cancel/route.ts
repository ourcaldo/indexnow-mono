/**
 * Paddle Subscription Cancel API
 * Allows authenticated users to cancel their subscription
 * 
 * Auto-applies 7-day refund policy:
 * - ≤7 days from purchase: Full refund + immediate cancellation
 * - >7 days: No refund + scheduled cancellation (access until period end)
 * 
 * TODO (#65): This route performs 2 writes across separate executeWithUserSession calls:
 *   1. Update indb_payment_subscriptions (cancel subscription)
 *   2. Update indb_auth_user_profiles (set subscription_end_date)
 * These should be wrapped in a single Postgres RPC for atomicity.
 * Blocked by schema discrepancies: route uses canceled_at/cancel_at_period_end/current_period_end
 * columns that don't exist in database_schema.sql (schema has cancelled_at, no cancel_at_period_end).
 * Resolve schema alignment first, then create cancel_subscription_service RPC.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database , getClientIP} from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];

// Selected subscription fields for fetch
type SubscriptionFetch = Pick<PaymentSubscriptionRow, 'user_id' | 'created_at' | 'current_period_end'>;

const cancelRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const body = await request.json();

    const validationResult = cancelRequestSchema.safeParse(body);
    if (!validationResult.success) {
        const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            validationResult.error.errors[0].message,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
        );
        return formatError(error);
    }

    const { subscriptionId } = validationResult.data;

    // Fetch subscription to verify ownership
    const subscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionFetch | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'fetch_subscription_for_cancellation',
            source: 'paddle/subscription/cancel',
            reason: 'User attempting to cancel subscription - ownership verification',
            metadata: { subscriptionId, endpoint: '/api/v1/payments/paddle/subscription/cancel' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .select('user_id, created_at, current_period_end')
                .eq('paddle_subscription_id', subscriptionId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
    );

    if (!subscription) {
        const error = await ErrorHandlingService.createError(
            ErrorType.BUSINESS_LOGIC,
            'Subscription not found',
            { severity: ErrorSeverity.LOW, statusCode: 404, userId: auth.userId }
        );
        return formatError(error);
    }

    if (subscription.user_id !== auth.userId) {
        const error = await ErrorHandlingService.createError(
            ErrorType.AUTHORIZATION,
            'You do not have permission to cancel this subscription',
            { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
        );
        return formatError(error);
    }

    // Calculate days since subscription creation
    const createdAt = new Date(subscription.created_at);
    const now = new Date();
    const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const refundEligible = daysActive <= 7;

    // Cancel subscription
    const canceledAt = new Date().toISOString();
    const updatedSub = await SecureServiceRoleWrapper.executeWithUserSession<PaymentSubscriptionRow>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'cancel_subscription',
            source: 'paddle/subscription/cancel',
            reason: refundEligible ? 'User canceling subscription with refund (within 7 days)' : 'User canceling subscription (past 7 day window)',
            metadata: { subscriptionId, daysActive, refundEligible, endpoint: '/api/v1/payments/paddle/subscription/cancel' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'update' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .update({
                    status: refundEligible ? 'cancelled' : 'active',
                    canceled_at: canceledAt,
                    cancel_at_period_end: !refundEligible,
                    updated_at: canceledAt
                })
                .eq('paddle_subscription_id', subscriptionId)
                .select()
                .single();

            if (error) throw new Error(`Failed to cancel subscription: ${error.message}`);
            return data;
        }
    );

    // Update user profile subscription end date
    await SecureServiceRoleWrapper.executeWithUserSession<void>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'update_profile_subscription_end',
            source: 'paddle/subscription/cancel',
            reason: 'Updating user profile after subscription cancellation',
            metadata: { subscriptionId, newEndDate: refundEligible ? canceledAt : subscription.current_period_end },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_auth_user_profiles', operationType: 'update' },
        async (db) => {
            await db
                .from('indb_auth_user_profiles')
                .update({
                    subscription_end_date: refundEligible ? canceledAt : subscription.current_period_end
                })
                .eq('user_id', auth.userId);
        }
    );

    return formatSuccess({
        action: refundEligible ? 'immediate_cancellation' : 'scheduled_cancellation',
        daysActive,
        refundEligible,
        subscription: updatedSub,
        refund: refundEligible ? { status: 'pending', message: 'Refund will be processed' } : null,
        message: refundEligible
            ? 'Subscription canceled with refund'
            : 'Subscription will be canceled at the end of the billing period',
    });
});
