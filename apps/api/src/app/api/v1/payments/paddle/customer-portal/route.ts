/**
 * Paddle Customer Portal API
 * Provides customer portal URL for authenticated users to manage their subscription
 *
 * @stub Returns a placeholder portal URL. Full Paddle customer portal integration requires PaddleCustomerService restoration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database , getClientIP} from '@indexnow/shared';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type SubscriptionPortalInfo = Pick<PaymentSubscriptionRow, 'paddle_subscription_id'>;

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    // Safety guard: prevent exposing placeholder portal URLs in production
    if (process.env.PADDLE_PORTAL_ENABLED !== 'true') {
        return NextResponse.json(
            {
                error: 'Service temporarily unavailable',
                message: 'Customer portal is being configured. PaddleCustomerService integration pending.',
            },
            { status: 503, headers: { 'Retry-After': '86400' } }
        );
    }

    // Get user's active subscription using SecureServiceRoleWrapper
    const subscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionPortalInfo | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'get_subscription_for_customer_portal',
            source: 'paddle/customer-portal',
            reason: 'User requesting Paddle customer portal URL',
            metadata: { endpoint: '/api/v1/payments/paddle/customer-portal' },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .select('paddle_subscription_id')
                .eq('user_id', auth.userId)
                .eq('status', 'active')
                .maybeSingle();

            if (error) {
                throw new Error(`Failed to fetch subscription: ${error.message}`);
            }
            return data;
        }
    );

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

    // STUB(M-13): Restore PaddleCustomerService and integrate here
    // When PaddleCustomerService is restored, use:
    // const portalUrl = await PaddleCustomerService.getCustomerPortalUrl(customerId);
    logger.warn('STUB: Customer portal endpoint hit — returning placeholder URL');

    const portalUrl = `https://checkout.paddle.com/subscription/manage?subscription=${subscription.paddle_subscription_id}`;

    return formatSuccess({
        portal_url: portalUrl,
        subscription_id: subscription.paddle_subscription_id,
        message: 'This is a placeholder URL. Full portal integration requires PaddleCustomerService restoration.'
    });
});
