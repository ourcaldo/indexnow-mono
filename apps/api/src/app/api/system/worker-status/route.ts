import { NextRequest, NextResponse } from 'next/server';
import { requireServerAdminAuth } from '@indexnow/auth';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger, ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { formatError } from '@/lib/core/api-response-formatter';

/**
 * GET /api/system/worker-status
 * Worker status endpoint - requires admin authentication
 * Note: Worker startup functionality needs to be restored separately
 */
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication to access worker status
        await requireServerAdminAuth(request);

        // TODO: Integrate getBackgroundServicesStatus once worker-startup.ts is restored
        const status = {
            isInitialized: true,
            message: 'Worker status endpoint restored - full status pending worker-startup restoration'
        };

        return NextResponse.json({
            system: 'IndexNow Studio Background Worker',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            backgroundServices: status,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting worker status');

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
