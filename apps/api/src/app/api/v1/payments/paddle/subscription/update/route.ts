/**
 * Paddle Subscription Update API
 * Allows authenticated users to update their subscription (e.g., change plan)
 * 
 * Note: PaddleSubscriptionService needs restoration. This route validates
 * ownership and uses simplified direct database update.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '../../../../../../../lib/core/api-response-middleware';
import { ErrorHandlingService } from '../../../../../../../lib/monitoring/error-handling';

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

    const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id, paddle_subscription_id')
        .eq('paddle_subscription_id', subscriptionId)
        .single();

    if (fetchError || !subscription) {
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

    // TODO: Integrate PaddleSubscriptionService.updateSubscription when restored
    // This requires Paddle API call to actually update the subscription
    // For now, update local database with new price ID
    const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
            paddle_price_id: newPriceId,
            updated_at: new Date().toISOString()
        })
        .eq('paddle_subscription_id', subscriptionId)
        .select()
        .single();

    if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    return formatSuccess({
        subscription: updatedSub,
        message: 'Subscription update request processed',
    });
});
