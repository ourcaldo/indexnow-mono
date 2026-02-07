import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Basic health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'IndexNow Studio API is running'
    });
}
