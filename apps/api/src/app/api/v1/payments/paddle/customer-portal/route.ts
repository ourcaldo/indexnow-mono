/**
 * Paddle Customer Portal API
 * Provides customer portal URL for authenticated users to manage their subscription
 * 
 * Note: PaddleCustomerService needs to be restored separately.
 * This provides a simplified stub that returns a placeholder URL.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { authenticatedApiWrapper, formatSuccess, formatError } from '../../../../../../lib/core/api-response-middleware';
import { ErrorHandlingService } from '../../../../../../lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const { data: subscription, error } = await supabaseAdmin
        .from('indb_payment_subscriptions')
        .select('paddle_subscription_id')
        .eq('user_id', auth.userId)
        .eq('status', 'active')
        .maybeSingle();

    if (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            `Failed to fetch subscription: ${error.message}`,
            {
                severity: ErrorSeverity.MEDIUM,
                userId: auth.userId,
                endpoint: '/api/v1/payments/paddle/customer-portal',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }

    if (!subscription || !subscription.paddle_subscription_id) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.BUSINESS_LOGIC,
            'No active Paddle subscription found',
            {
                severity: ErrorSeverity.LOW,
                userId: auth.userId,
                endpoint: '/api/v1/payments/paddle/customer-portal',
                statusCode: 404
            }
        );
        return formatError(structuredError);
    }

    // TODO: Restore PaddleCustomerService and integrate here
    // When PaddleCustomerService is restored, use:
    // const portalUrl = await PaddleCustomerService.getCustomerPortalUrl(customerId);

    // For now, construct a placeholder portal URL using subscription ID
    // Paddle's actual customer portal requires customer ID, not subscription ID
    // This is a placeholder until PaddleCustomerService is restored
    const portalUrl = `https://checkout.paddle.com/subscription/manage?subscription=${subscription.paddle_subscription_id}`;

    return formatSuccess({
        portal_url: portalUrl,
        subscription_id: subscription.paddle_subscription_id,
        message: 'This is a placeholder URL. Full portal integration requires PaddleCustomerService restoration.'
    });
});
