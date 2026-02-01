import { NextResponse } from 'next/server';
import { formatSuccess } from '@indexnow/shared';

/**
 * GET /api/system/status
 * Basic health check for the API
 */
export async function GET() {
  return NextResponse.json(formatSuccess({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'api'
  }));
}
