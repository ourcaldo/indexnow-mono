/** @stub This endpoint is not yet implemented. Returns 501. */

import { NextResponse } from 'next/server';
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware';

/**
 * POST /api/v1/billing/payment
 * Create a payment - Currently returns unavailable status
 * Note: Legacy payment methods (Midtrans/Bank Transfer) removed. Paddle integration pending.
 */
export const POST = authenticatedApiWrapper(async () => {
    return NextResponse.json(
        {
            error: 'Not implemented',
            message: 'Payment processing is not yet available. Paddle integration pending.',
            retryAfterSeconds: 2592000,
        },
        { status: 501, headers: { 'Retry-After': '2592000' } }
    );
});
