/**
 * Paddle Refund Window Info API
 * Returns refund eligibility information for a subscription
 * 
 * Note: PaddleCancellationService needs restoration. This route implements
 * simplified refund window calculation.
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

const refundWindowRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    const validationResult = refundWindowRequestSchema.safeParse({ subscriptionId });
    if (!validationResult.success) {
        const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            validationResult.error.errors[0].message,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
        );
        return formatError(error);
    }

    try {
        // Get subscription info
        const { data: subscription, error: fetchError } = await supabaseAdmin
            .from('indb_payment_subscriptions')
            .select('user_id, created_at, paddle_subscription_id')
            .eq('paddle_subscription_id', validationResult.data.subscriptionId)
            .single();

        if (fetchError || !subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.user_id !== auth.userId) {
            throw new Error('You do not have permission to view this subscription');
        }

        // Calculate refund window
        const createdAt = new Date(subscription.created_at);
        const now = new Date();
        const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const refundWindowDays = 7;
        const daysRemaining = Math.max(0, refundWindowDays - daysActive);
        const isEligible = daysRemaining > 0;

        // Calculate refund window expiry date
        const refundWindowExpiry = new Date(createdAt);
        refundWindowExpiry.setDate(refundWindowExpiry.getDate() + refundWindowDays);

        return formatSuccess({
            subscriptionId: subscription.paddle_subscription_id,
            refundWindowDays,
            daysActive,
            daysRemaining,
            isEligible,
            refundWindowExpiry: refundWindowExpiry.toISOString(),
            message: isEligible
                ? `You have ${daysRemaining} days remaining for a full refund`
                : 'Refund window has expired'
        });
    } catch (error) {
        const err = await ErrorHandlingService.createError(
            ErrorType.BUSINESS_LOGIC,
            error instanceof Error ? error.message : 'Failed to get refund window info',
            { severity: ErrorSeverity.LOW, statusCode: 400, userId: auth.userId }
        );
        return formatError(err);
    }
});
