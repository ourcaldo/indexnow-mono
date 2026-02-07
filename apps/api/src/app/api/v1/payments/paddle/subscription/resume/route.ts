/**
 * Paddle Subscription Resume API
 * Allows authenticated users to resume their paused subscription
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

const resumeRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
    effectiveFrom: z.enum(['immediately', 'next_billing_period']).optional().default('immediately'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const body = await request.json();

    const validationResult = resumeRequestSchema.safeParse(body);
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
            'You do not have permission to resume this subscription',
            { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
        );
        return formatError(error);
    }

    // TODO: Integrate PaddleSubscriptionService.resumeSubscription when restored
    // For now, update database directly
    const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
            status: 'active',
            paused_at: null,
            updated_at: new Date().toISOString()
        })
        .eq('paddle_subscription_id', subscriptionId)
        .select()
        .single();

    if (updateError) {
        throw new Error(`Failed to resume subscription: ${updateError.message}`);
    }

    return formatSuccess({
        subscription: updatedSub,
        message: 'Subscription resumed successfully',
    });
});
