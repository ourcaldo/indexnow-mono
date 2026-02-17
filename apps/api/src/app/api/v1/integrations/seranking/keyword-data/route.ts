/**
 * SeRanking Keyword Data API Endpoint
 * GET /api/v1/integrations/seranking/keyword-data
 *
 * @stub Integration not yet implemented. The SE Ranking integration
 * requires database migration (indb_seranking_integration table) before enabling.
 */

import { NextRequest } from 'next/server';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const error = await ErrorHandlingService.createError(
        ErrorType.BUSINESS_LOGIC,
        'SeRanking keyword data integration is not yet configured.',
        {
            severity: ErrorSeverity.LOW,
            statusCode: 501,
            userId: auth.userId,
            endpoint: '/api/v1/integrations/seranking/keyword-data'
        }
    );
    return formatError(error);
});
