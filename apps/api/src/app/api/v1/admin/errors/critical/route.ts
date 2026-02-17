/**
 * Critical Errors API Endpoint
 * Provides recent critical errors that need immediate attention
 * Updated for Phase 3: Shows ALL critical errors, not just rank-check errors
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { adminApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

interface CriticalError {
    id: string;
    error_type: string;
    severity: string;
    message: string;
    user_message?: string;
    user_id?: string;
    endpoint?: string;
    created_at: string;
    resolved_at?: string;
}

interface CriticalErrorResult {
    criticalErrors: CriticalError[];
    count: number;
    hasAlerts: boolean;
}

/**
 * GET /api/v1/admin/errors/critical
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Maximum number of critical errors to return (default: 50, max: 200)
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    const { searchParams } = new URL(request.url);
    const endpoint = new URL(request.url).pathname;
    const parsedLimit = parseInt(searchParams.get('limit') || '50');
    const parsedPage = parseInt(searchParams.get('page') || '1');
    const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(200, Math.max(1, parsedLimit));
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const offset = (page - 1) * limit;

    const result = await SecureServiceRoleWrapper.executeSecureOperation<CriticalErrorResult>(
        {
            userId: adminUser.id,
            operation: 'fetch_critical_errors',
            reason: 'Admin viewing unresolved critical errors',
            source: endpoint,
            metadata: { limit, page }
        },
        {
            table: 'indb_system_error_logs',
            operationType: 'select',
            columns: ['*'],
            whereConditions: {
                severity: 'CRITICAL',
                resolved_at: null
            }
        },
        async () => {
            const { data: criticalErrors, error, count } = await supabaseAdmin
                .from('indb_system_error_logs')
                .select('*', { count: 'exact' })
                .eq('severity', 'CRITICAL')
                .is('resolved_at', null) // Only unresolved critical errors
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const total = count || 0;
            return {
                criticalErrors: (criticalErrors || []) as CriticalError[],
                count: total,
                hasAlerts: total > 0,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: total > offset + limit,
                    hasPrevPage: page > 1
                }
            };
        }
    );

    return formatSuccess(result);
});
