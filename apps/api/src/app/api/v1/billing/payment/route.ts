/** @stub This endpoint is not yet implemented. Returns 501. */

import { NextRequest, NextResponse } from 'next/server';
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware';
import { checkRouteRateLimit } from '@/lib/rate-limiting/route-rate-limit';

/**
 * POST /api/v1/billing/payment
 * Create a payment - Currently returns unavailable status
 * Note: Legacy payment methods (Midtrans/Bank Transfer) removed. Paddle integration pending.
 */
export const POST = authenticatedApiWrapper(async (request: NextRequest) => {
  const rateLimited = await checkRouteRateLimit(
    request,
    { maxAttempts: 10, windowMs: 60_000 },
    'billing_payment'
  );
  if (rateLimited) return rateLimited;

  return NextResponse.json(
    {
      error: 'Not implemented',
      message: 'Payment processing is not yet available. Paddle integration pending.',
      retryAfterSeconds: 2592000,
    },
    { status: 501, headers: { 'Retry-After': '2592000' } }
  );
});
