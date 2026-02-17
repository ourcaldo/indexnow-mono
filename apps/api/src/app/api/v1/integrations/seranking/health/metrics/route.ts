/**
 * SeRanking Health Metrics API Endpoint
 * GET /api/v1/integrations/seranking/health/metrics
 *
 * @stub Returns placeholder response. The SeRanking integration metrics
 * are not yet implemented. Create the metrics handler before enabling.
 */

import { NextRequest } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatError, createStandardError } from '@/lib/core/api-response-middleware';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

export const GET = adminApiWrapper(async (
  _request: NextRequest,
) => {
  return formatError(await createStandardError(
    ErrorType.VALIDATION,
    'SeRanking health metrics endpoint is not yet implemented',
    { statusCode: 501, severity: ErrorSeverity.LOW }
  ));
});
