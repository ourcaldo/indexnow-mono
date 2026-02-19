import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { requireServerSuperAdminAuth } from '@indexnow/auth/server';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { publicApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

// Type for system stats query result
interface SystemStatsResult {
  usersCount: number;
  recentActivityCount: number;
}

/**
 * GET /api/v1/system/status
 * System status endpoint - requires super admin authentication
 */
export const GET = publicApiWrapper(async (request: NextRequest) => {
  try {
    // Require super admin authentication
    // @ts-expect-error — NextRequest from @indexnow/auth resolves to a different pnpm physical path. Fix: pnpm overrides or shared next singleton.
    await requireServerSuperAdminAuth(request);

    // Get system statistics using secure admin operation
    const systemStats = await SecureServiceRoleWrapper.executeSecureOperation<SystemStatsResult>(
      {
        userId: 'admin',
        operation: 'get_system_status',
        source: 'system/status',
        reason: 'Admin fetching system status and statistics',
        metadata: {
          endpoint: '/api/v1/system/status',
          method: 'GET',
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
      {
        table: 'indb_auth_user_profiles',
        operationType: 'select',
      },
      async () => {
        // Get users count
        const { count: usersCount, error: usersError } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id', { count: 'exact', head: true });

        if (usersError) {
          throw new Error(`Failed to get users count: ${usersError.message}`);
        }

        // Get recent activity count (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { count: activityCount, error: activityError } = await supabaseAdmin
          .from('indb_security_activity_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString());

        return {
          usersCount: usersCount || 0,
          recentActivityCount: activityCount || 0,
        };
      }
    );

    // C-08: Removed process.uptime(), memoryUsage(), node_version, platform
    // to prevent information disclosure (these aid targeted exploits).
    return formatSuccess({
      system: {
        status: 'operational',
      },
      database: {
        status: 'connected',
        total_users: systemStats.usersCount,
        recent_activity_24h: systemStats.recentActivityCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Super admin access required') {
      const authError = await ErrorHandlingService.createError(
        ErrorType.AUTHORIZATION,
        'Super admin access required',
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 403,
          userMessageKey: 'default',
        }
      );
      return formatError(authError);
    }

    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      {
        statusCode: 500,
        metadata: {
          context: { endpoint: '/api/v1/system/status' },
        },
      }
    );
    return formatError(structuredError);
  }
});
