import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess, type ErrorType, type ErrorSeverity } from '@indexnow/shared';

/**
 * GET /api/v1/admin/errors
 * List system error logs
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ErrorType | null;
  const severity = searchParams.get('severity') as ErrorSeverity | null;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const result = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: adminUser.id,
      operation: 'fetch_error_logs',
      reason: 'Admin viewing error logs',
      source: '/api/v1/admin/errors',
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
    },
    async () => {
      let query = supabaseAdmin
        .from('indb_system_error_logs')
        .select('*', { count: 'exact' });

      if (type) query = query.eq('error_type', type);
      if (severity) query = query.eq('severity', severity);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { errors: data || [], count: count || 0 };
    }
  );

  return formatSuccess(result);
});
