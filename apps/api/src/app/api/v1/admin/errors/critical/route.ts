import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess, ErrorSeverity } from '@indexnow/shared';

/**
 * GET /api/v1/admin/errors/critical
 * Retrieve critical system errors
 */
export const GET = adminApiWrapper(async (request, adminUser) => {
  const result = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'fetch_critical_errors',
      reason: 'Admin viewing critical errors',
      source: '/api/v1/admin/errors/critical',
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('*')
        .eq('severity', ErrorSeverity.CRITICAL)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  );

  return formatSuccess(result);
});
