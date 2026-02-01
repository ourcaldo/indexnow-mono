import { SecureServiceRoleWrapper, supabaseAdmin, type Database } from '@indexnow/database';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@indexnow/shared';

type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row'];

/**
 * GET /api/v1/admin/errors/stats
 * Retrieve error statistics
 */
export const GET = adminApiWrapper(async (request, adminUser) => {
  const result = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'fetch_error_stats',
      reason: 'Admin viewing error statistics',
      source: '/api/v1/admin/errors/stats',
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('severity, error_type, created_at');

      if (error) throw error;

      const dataArray = (data || []) as Pick<SystemErrorLog, 'severity' | 'error_type' | 'created_at'>[];

      // Simple aggregation
      const stats = {
        total: dataArray.length,
        bySeverity: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        recentCount: 0
      };

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      dataArray.forEach(err => {
        stats.bySeverity[err.severity] = (stats.bySeverity[err.severity] || 0) + 1;
        stats.byType[err.error_type] = (stats.byType[err.error_type] || 0) + 1;
        if (new Date(err.created_at).getTime() > oneDayAgo) {
          stats.recentCount++;
        }
      });

      return stats;
    }
  );

  return formatSuccess(result);
});
