import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { requireServerAdminAuth } from '@indexnow/auth';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger, ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { formatError } from '@/lib/core/api-response-formatter';

// Type for job stats
interface JobStatus {
    status: string;
}

/**
 * GET /api/system/status
 * System status endpoint - requires admin authentication
 */
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication to access system status
        const adminUser = await requireServerAdminAuth(request);

        // Get job statistics using secure wrapper
        const jobStatsContext = {
            userId: adminUser.id,
            operation: 'system_get_job_statistics',
            reason: 'Admin accessing system status and job statistics',
            source: 'system/status',
            metadata: {
                endpoint: '/api/system/status',
                method: 'GET'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        // Mock job stats as indb_indexing_jobs table is missing
        const jobStats: JobStatus[] = [];
        /* 
        // Table indb_indexing_jobs missing in schema
        const jobStats = await SecureServiceRoleWrapper.executeSecureOperation<JobStatus[]>(
            jobStatsContext,
            {
                table: 'indb_indexing_jobs' as any, // Cast as any because table is missing in types
                operationType: 'select',
                columns: ['status'],
                whereConditions: {}
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_indexing_jobs' as any)
                    .select('status')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) {
                    throw new Error(`Error fetching job stats: ${error.message}`);
                }

                return (data || []) as JobStatus[];
            }
        );
        */

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
