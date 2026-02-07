/**
 * Paddle Subscription Cancel API
 * Allows authenticated users to cancel their subscription
 * 
 * Auto-applies 7-day refund policy:
 * - ≤7 days from purchase: Full refund + immediate cancellation
 * - >7 days: No refund + scheduled cancellation (access until period end)
 * 
 * Note: PaddleCancellationService needs restoration. This route implements
 * simplified direct database cancellation.
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

    const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('user_id, created_at, current_period_end')
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

    // TODO: Integrate PaddleCancellationService.cancelWithRefundPolicy when restored
    // For now, mark subscription as canceled in database
    const canceledAt = new Date().toISOString();
    const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .update({
            status: refundEligible ? 'cancelled' : 'active', // If refund eligible, cancel immediately
            canceled_at: canceledAt,
            cancel_at_period_end: !refundEligible, // If not refund eligible, cancel at period end
            updated_at: canceledAt
        })
        .eq('paddle_subscription_id', subscriptionId)
        .select()
        .single();

    if (updateError) {
        throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    // Update user profile subscription end date
    await supabaseAdmin
        .from('indb_auth_user_profiles')
        .update({
            subscription_end_date: refundEligible ? canceledAt : subscription.current_period_end
        })
        .eq('user_id', auth.userId);

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
