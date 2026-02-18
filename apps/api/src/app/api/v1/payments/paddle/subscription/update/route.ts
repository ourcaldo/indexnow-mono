/**
 * Paddle Subscription Update API
 * Allows authenticated users to update their subscription (e.g., change plan)
 *
 * @stub Only updates local DB. Does NOT call Paddle API to actually change the subscription.
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
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type SubscriptionOwnerCheck = Pick<PaymentSubscriptionRow, 'user_id' | 'paddle_subscription_id'>;

const updateRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
    newPriceId: z.string().min(1, 'New price ID is required'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const body = await request.json();

    const validationResult = updateRequestSchema.safeParse(body);
    if (!validationResult.success) {
        const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            validationResult.error.errors[0].message,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
        );
        return formatError(error);
    }

    const { subscriptionId, newPriceId } = validationResult.data;

    // Verify ownership
    const subscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionOwnerCheck | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'verify_subscription_ownership_for_update',
            source: 'paddle/subscription/update',
            reason: 'User attempting to update subscription - ownership verification',
            metadata: { subscriptionId, newPriceId, endpoint: '/api/v1/payments/paddle/subscription/update' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .select('user_id, paddle_subscription_id')
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
            'You do not have permission to update this subscription',
            { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
        );
        return formatError(error);
    }

    // Update the subscription with new price ID
    // STUB(M-13): Integrate PaddleSubscriptionService.updateSubscription when restored
    logger.warn('STUB: Subscription update only updates local DB — Paddle API call pending');
    const updatedAt = new Date().toISOString();
    const updatedSub = await SecureServiceRoleWrapper.executeWithUserSession<PaymentSubscriptionRow>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'update_subscription_price',
            source: 'paddle/subscription/update',
            reason: 'User updating their subscription plan',
            metadata: { subscriptionId, newPriceId, endpoint: '/api/v1/payments/paddle/subscription/update' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'update' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .update({
                    paddle_price_id: newPriceId,
                    updated_at: updatedAt
                })
                .eq('paddle_subscription_id', subscriptionId)
                .select()
                .single();

            if (error) throw new Error(`Failed to update subscription: ${error.message}`);
            return data;
        }
    );

    return formatSuccess({
        subscription: updatedSub,
        message: 'Subscription update request processed',
    });
});
