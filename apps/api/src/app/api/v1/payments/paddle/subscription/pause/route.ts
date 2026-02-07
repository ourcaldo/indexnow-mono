/**
 * Paddle Subscription Pause API
 * Allows authenticated users to pause their subscription
 * 
 * Note: PaddleSubscriptionService needs restoration. This route validates
 * ownership and prepares request but uses simplified direct database update.
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

const pauseRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
    effectiveFrom: z.enum(['immediately', 'next_billing_period']).optional(),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const body = await request.json();

    const validationResult = pauseRequestSchema.safeParse(body);
    if (!validationResult.success) {
        const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            validationResult.error.errors[0].message,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
        );
        return formatError(error);
    }

    const { subscriptionId } = validationResult.data;

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
            'You do not have permission to pause this subscription',
            { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
        );
        return formatError(error);
    }

    // TODO: Integrate PaddleSubscriptionService.pauseSubscription when restored
    // For now, update database directly
    const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
            status: 'paused',
            paused_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('paddle_subscription_id', subscriptionId)
        .select()
        .single();

    if (updateError) {
        throw new Error(`Failed to pause subscription: ${updateError.message}`);
    }

    return formatSuccess({
        subscription: updatedSub,
        message: 'Subscription paused successfully',
    });
});
