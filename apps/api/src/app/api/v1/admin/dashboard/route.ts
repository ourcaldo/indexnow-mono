/**
 * Admin Dashboard Stats API
 * GET /api/v1/admin/dashboard
 *
 * Returns aggregated dashboard statistics for admin overview
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
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
        adminEmail: adminUser.email || 'unknown',
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const stats = await SecureServiceRoleWrapper.executeSecureOperation<DashboardStats>(
      statsContext,
      {
        table: 'indb_auth_user_profiles',
        operationType: 'select',
        columns: ['*'],
      },
      async () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // (#69) Run all count queries in parallel instead of sequentially
        const [
          totalUsersResult,
          newUsersThisWeekResult,
          criticalErrorsResult,
          unresolvedErrorsResult,
          errorsLast24hResult,
          totalTransactionsResult,
          completedThisMonthResult,
          pendingTransactionsResult,
          totalKeywordsResult,
          checkedTodayResult,
        ] = await Promise.all([
          supabaseAdmin.from('indb_auth_user_profiles').select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo),
          supabaseAdmin
            .from('indb_system_error_logs')
            .select('*', { count: 'exact', head: true })
            .eq('severity', 'critical')
            .is('resolved_at', null),
          supabaseAdmin
            .from('indb_system_error_logs')
            .select('*', { count: 'exact', head: true })
            .is('resolved_at', null),
          supabaseAdmin
            .from('indb_system_error_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday),
          supabaseAdmin
            .from('indb_payment_transactions')
            .select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('indb_payment_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('created_at', monthAgo),
          supabaseAdmin
            .from('indb_payment_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabaseAdmin.from('indb_rank_keywords').select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('indb_keyword_rankings')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today),
        ]);

        return {
          users: {
            total: totalUsersResult.count || 0,
            activeToday: 0, // Would need activity log query
            newThisWeek: newUsersThisWeekResult.count || 0,
          },
          errors: {
            critical: criticalErrorsResult.count || 0,
            unresolved: unresolvedErrorsResult.count || 0,
            last24h: errorsLast24hResult.count || 0,
          },
          transactions: {
            total: totalTransactionsResult.count || 0,
            completedThisMonth: completedThisMonthResult.count || 0,
            pendingCount: pendingTransactionsResult.count || 0,
          },
          keywords: {
            total: totalKeywordsResult.count || 0,
            checkedToday: checkedTodayResult.count || 0,
          },
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
