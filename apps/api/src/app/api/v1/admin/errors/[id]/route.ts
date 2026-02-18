import { SecureServiceRoleWrapper, supabaseAdmin, type Database } from '@indexnow/database';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminApiWrapper, formatError, createStandardError } from '@/lib/core/api-response-middleware';
import { formatSuccess, ErrorType, ErrorSeverity } from '@indexnow/shared';

type SystemErrorLog = Database['public']['Tables']['indb_system_error_logs']['Row'];
type SystemErrorLogUpdate = Database['public']['Tables']['indb_system_error_logs']['Update'];

/**
 * GET /api/v1/admin/errors/[id]
 * Retrieve detailed error information by ID
 */
export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context
) => {
  const { id: errorId } = await context.params as Record<string, string>;
  const endpoint = new URL(request.url).pathname;

  const result = await SecureServiceRoleWrapper.executeSecureOperation(
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

      const systemError = error as SystemErrorLog;

      // Get user info if user_id exists
      let userInfo = null;
      if (systemError.user_id) {
        const { data: user } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('email, full_name') // Note: email might not exist in profile, checking runtime
          .eq('user_id', systemError.user_id)
          .single();
        userInfo = user;
      }

      // Get related errors (same type, same user, same endpoint - last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: relatedErrors } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('id, error_type, message, severity, created_at')
        .neq('id', errorId)
        .or(`error_type.eq.${systemError.error_type},user_id.eq.${systemError.user_id},endpoint.eq.${systemError.endpoint}`)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        error: systemError,
        userInfo,
        relatedErrors: (relatedErrors || []) as Pick<SystemErrorLog, 'id' | 'error_type' | 'message' | 'severity' | 'created_at'>[]
      };
    }
  );

  return formatSuccess(result);
});

const errorActionSchema = z.object({
  action: z.enum(['resolve', 'acknowledge']),
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
  const { id: errorId } = await context.params as Record<string, string>;
  const endpoint = new URL(request.url).pathname;
  const body = await request.json();
  const parseResult = errorActionSchema.safeParse(body);
  if (!parseResult.success) {
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      parseResult.error.errors[0]?.message || 'Invalid request body',
      { statusCode: 400, severity: ErrorSeverity.LOW }
    ));
  }
  const { action } = parseResult.data;

  const result = await SecureServiceRoleWrapper.executeSecureOperation(
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

      return { error: data as SystemErrorLog, action, updatedAt: new Date().toISOString() };
    }
  );

  return formatSuccess(result);
});
