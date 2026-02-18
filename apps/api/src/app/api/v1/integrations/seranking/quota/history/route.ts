/**
 * SeRanking Quota History API Endpoint
 * GET /api/v1/integrations/seranking/quota/history
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
            message: 'SeRanking quota history integration is not yet configured.',
            retryAfterSeconds: 2592000,
        },
        { status: 501, headers: { 'Retry-After': '2592000' } }
    );
});
