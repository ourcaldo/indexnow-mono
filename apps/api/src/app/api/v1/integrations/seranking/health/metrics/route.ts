/**
 * SeRanking Health Metrics API Endpoint
 * GET /api/v1/integrations/seranking/health/metrics
 *
 * @stub Returns placeholder response. The SeRanking integration metrics
 * are not yet implemented. Create the metrics handler before enabling.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SeRanking health metrics endpoint is not yet implemented',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}
