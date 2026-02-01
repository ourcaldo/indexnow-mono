import { NextRequest } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { SecureServiceRoleWrapper, supabaseAdmin, type Database } from '@indexnow/database';

type SystemErrorLogUpdate = Database['public']['Tables']['indb_system_error_logs']['Update'];
type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row'];

/**
 * GET /api/v1/admin/errors/[id]
 * Retrieve detailed error information by ID
 */
export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context
) => {
  const params = await context?.params;
  const errorId = params?.id as string;
  
  if (!errorId) {
    throw new Error('Error ID is required');
  }
  
  const endpoint = new URL(request.url).pathname;

  const result = await SecureServiceRoleWrapper.executeSecureOperation<{
    error: SystemErrorLog;
    userInfo: { email: string; full_name: string } | null;
    relatedErrors: Partial<SystemErrorLog>[];
  }>(
    {
      userId: adminUser.id,
      operation: 'fetch_error_details',
      reason: 'Admin viewing detailed error information',
      source: endpoint,
      metadata: { errorId }
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
      whereConditions: { id: errorId }
    },
    async () => {
      // Get error details
      const { data: error, error: fetchError } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('*')
        .eq('id', errorId)
        .single();

      if (fetchError) throw fetchError;
      if (!error) throw new Error('Error not found');

      const errorLog = error as unknown as SystemErrorLog;

      // Get user info if user_id exists
      let userInfo: { email: string; full_name: string } | null = null;
      if (errorLog.user_id) {
        const { data: user } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('email, full_name')
          .eq('user_id', errorLog.user_id)
          .single();
        userInfo = user as { email: string; full_name: string } | null;
      }

      // Get related errors (same type, same user, same endpoint - last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: relatedErrors } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('id, error_type, message, severity, created_at')
        .neq('id', errorId)
        .or(`error_type.eq.${errorLog.error_type},user_id.eq.${errorLog.user_id || ''},endpoint.eq.${errorLog.endpoint || ''}`)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        error: errorLog,
        userInfo,
        relatedErrors: (relatedErrors as unknown as Partial<SystemErrorLog>[]) || []
      };
    }
  );

  return formatSuccess(result);
});

/**
 * PATCH /api/v1/admin/errors/[id]
 * Mark error as resolved or acknowledged
 */
export const PATCH = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context
) => {
  const params = await context?.params;
  const errorId = params?.id as string;
  
  if (!errorId) {
    throw new Error('Error ID is required');
  }
  
  const endpoint = new URL(request.url).pathname;
  const body = await request.json();
  const { action } = body; // 'resolve' or 'acknowledge'

  if (!action || !['resolve', 'acknowledge'].includes(action)) {
    throw new Error('Invalid action. Must be "resolve" or "acknowledge"');
  }

  const result = await SecureServiceRoleWrapper.executeSecureOperation<{
    error: SystemErrorLog;
    action: string;
    updatedAt: string;
  }>(
    {
      userId: adminUser.id,
      operation: 'update_error_status',
      reason: `Admin ${action}d error`,
      source: endpoint,
      metadata: { errorId, action }
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'update',
      data: {},
      whereConditions: { id: errorId }
    },
    async () => {
      const updateData: SystemErrorLogUpdate = {};

      if (action === 'resolve') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = adminUser.id;
      } else if (action === 'acknowledge') {
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = adminUser.id;
      }

      const { data, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .update(updateData)
        .eq('id', errorId)
        .select()
        .single();

      if (error) throw error;

      return { error: data as unknown as SystemErrorLog, action, updatedAt: new Date().toISOString() };
    }
  );

  return formatSuccess(result);
});
