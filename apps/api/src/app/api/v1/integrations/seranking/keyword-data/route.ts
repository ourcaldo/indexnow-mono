/**
 * SeRanking Keyword Data API Endpoint
 * GET /api/v1/integrations/seranking/keyword-data
 *
 * @stub Integration not yet implemented. The SE Ranking integration
 * requires database migration (indb_seranking_integration table) before enabling.
 */

import { NextResponse } from 'next/server';
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware';

export const GET = authenticatedApiWrapper(async () => {
    return NextResponse.json(
        {
            error: 'Not implemented',
            message: 'SeRanking keyword data integration is not yet configured.',
            retryAfterSeconds: 2592000,
        },
        { status: 501, headers: { 'Retry-After': '2592000' } }
    );
});
