import { NextRequest, NextResponse } from 'next/server';
import { requireServerAdminAuth } from '@indexnow/auth';
import { AppConfig, ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger, ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { formatError } from '@/lib/core/api-response-formatter';

/**
 * GET /api/system/status
 * System status endpoint - requires admin authentication
 */
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication to access system status
        await requireServerAdminAuth(request);

        // Job statistics are not available - table removed from schema
        const stats = {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            total: 0
        };

        return Response.json({
            system: 'IndexNow Studio',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            jobStats: stats,
            database: 'Supabase Connected',
            googleApi: 'Available'
        });

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting system status');

        // Handle authentication errors
        if (error instanceof Error && error.message === 'Admin access required') {
            const authError = await ErrorHandlingService.createError(
                ErrorType.AUTHORIZATION,
                'Admin access required',
                {
                    severity: ErrorSeverity.MEDIUM,
                    statusCode: 403,
                    userMessageKey: 'default'
                }
            );
            const errorResponse = formatError(authError);
            return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
        }

        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.HIGH,
                statusCode: 500,
                userMessageKey: 'default'
            }
        );
        const errorResponse = formatError(systemError);
        return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
    }
}
