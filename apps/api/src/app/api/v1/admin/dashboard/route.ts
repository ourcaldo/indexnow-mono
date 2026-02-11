/**
 * Admin Dashboard Stats API
 * GET /api/v1/admin/dashboard
 * 
 * Returns aggregated dashboard statistics for admin overview
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface DashboardStats {
    users: {
        total: number;
        activeToday: number;
        newThisWeek: number;
    };
    errors: {
        critical: number;
        unresolved: number;
        last24h: number;
    };
    transactions: {
        total: number;
        completedThisMonth: number;
        pendingCount: number;
    };
    keywords: {
        total: number;
        checkedToday: number;
    };
}

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const statsContext = {
            userId: adminUser.id,
            operation: 'admin_get_dashboard_stats',
            reason: 'Admin fetching dashboard statistics for overview',
            source: 'admin/dashboard',
            metadata: {
                endpoint: '/api/v1/admin/dashboard',
                adminEmail: adminUser.email || 'unknown'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const stats = await SecureServiceRoleWrapper.executeSecureOperation<DashboardStats>(
            statsContext,
            {
                table: 'indb_auth_user_profiles',
                operationType: 'select',
                columns: ['*']
            },
            async () => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

                // User stats
                const { count: totalUsers } = await supabaseAdmin
                    .from('indb_auth_user_profiles')
                    .select('*', { count: 'exact', head: true });

                const { count: newUsersThisWeek } = await supabaseAdmin
                    .from('indb_auth_user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', weekAgo);

                // Error stats
                const { count: criticalErrors } = await supabaseAdmin
                    .from('indb_system_error_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('severity', 'CRITICAL')
                    .is('resolved_at', null);

                const { count: unresolvedErrors } = await supabaseAdmin
                    .from('indb_system_error_logs')
                    .select('*', { count: 'exact', head: true })
                    .is('resolved_at', null);

                const { count: errorsLast24h } = await supabaseAdmin
                    .from('indb_system_error_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', yesterday);

                // Transaction stats
                const { count: totalTransactions } = await supabaseAdmin
                    .from('indb_payment_transactions')
                    .select('*', { count: 'exact', head: true });

                const { count: completedThisMonth } = await supabaseAdmin
                    .from('indb_payment_transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('created_at', monthAgo);

                const { count: pendingTransactions } = await supabaseAdmin
                    .from('indb_payment_transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                // Keyword stats
                const { count: totalKeywords } = await supabaseAdmin
                    .from('indb_seranking_keywords')
                    .select('*', { count: 'exact', head: true });

                const { count: checkedToday } = await supabaseAdmin
                    .from('indb_seranking_keyword_results')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today);

                return {
                    users: {
                        total: totalUsers || 0,
                        activeToday: 0, // Would need activity log query
                        newThisWeek: newUsersThisWeek || 0
                    },
                    errors: {
                        critical: criticalErrors || 0,
                        unresolved: unresolvedErrors || 0,
                        last24h: errorsLast24h || 0
                    },
                    transactions: {
                        total: totalTransactions || 0,
                        completedThisMonth: completedThisMonth || 0,
                        pendingCount: pendingTransactions || 0
                    },
                    keywords: {
                        total: totalKeywords || 0,
                        checkedToday: checkedToday || 0
                    }
                };
            }
        );

        return formatSuccess({ stats });
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});
