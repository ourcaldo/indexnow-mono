import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

/**
 * POST /api/v1/billing/payment
 * Create a payment - Currently returns unavailable status
 * Note: Legacy payment methods (Midtrans/Bank Transfer) removed. Paddle integration pending.
 */
export const POST = authenticatedApiWrapper(async (request, auth) => {
    // Parse request for logging
    let body: Record<string, unknown> = {};
    try {
        body = await request.json();
    } catch {
        // Invalid JSON body
    }

    const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Payment processing is currently unavailable. Paddle integration pending.',
        {
            severity: ErrorSeverity.MEDIUM,
            statusCode: 503,
            userId: auth.userId,
            userMessageKey: 'default',
            metadata: {
                requestedMethod: body.payment_method,
                note: 'Legacy payment methods (Midtrans/Bank Transfer) removed. Paddle integration in progress.',
                endpoint: '/api/v1/billing/payment'
            }
        }
    );

    return formatError(error);
});
