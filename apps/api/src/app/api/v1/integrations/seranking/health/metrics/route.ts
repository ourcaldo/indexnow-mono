/**
 * SeRanking Health Metrics API Endpoint
 * GET /api/v1/integrations/seranking/health/metrics
 *
 * @stub Returns placeholder response. The SeRanking integration metrics
 * are not yet implemented. Create the metrics handler before enabling.
 */

import { NextResponse } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';

export const GET = adminApiWrapper(async () => {
    return NextResponse.json(
        {
            error: 'Not implemented',
            message: 'SeRanking health metrics endpoint is not yet implemented.',
            retryAfterSeconds: 2592000,
        },
        { status: 501, headers: { 'Retry-After': '2592000' } }
    );
});
