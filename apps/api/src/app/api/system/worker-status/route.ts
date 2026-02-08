import { NextRequest, NextResponse } from 'next/server';
import { requireServerAdminAuth } from '@indexnow/auth';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger, ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { formatError } from '@/lib/core/api-response-formatter';

/**
 * GET /api/system/worker-status
 * Worker status endpoint - requires admin authentication
 */
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication to access worker status
        await requireServerAdminAuth(request);

        // Background services status
        const status = {
            isInitialized: true,
            services: {
                api: 'running',
                database: 'connected'
            }
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
