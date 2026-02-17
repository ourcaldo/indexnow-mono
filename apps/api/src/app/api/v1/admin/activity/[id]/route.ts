import { NextRequest, NextResponse } from 'next/server';
import { adminApiWrapper, createStandardError, formatError, formatSuccess } from '@/lib/core/api-response-middleware';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';
import {
  SecureServiceRoleWrapper,
  SecureServiceRoleHelpers,
  supabaseAdmin
} from '@indexnow/database';

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters');
  }
  const { id } = await context.params;

  // Fetch specific log
  const operationContext = {
    userId: adminUser.id,
    operation: 'admin_get_activity_log',
    reason: 'Admin retrieving specific activity log',
    source: 'admin/activity/[id]',
    metadata: { requestedLogId: id }
  };

  const logs = await SecureServiceRoleHelpers.secureSelect(
    operationContext,
    'indb_security_activity_logs',
    ['*'],
    { id: id }
  );

  if (!logs || logs.length === 0) {
    return formatError(await createStandardError(
      ErrorType.NOT_FOUND,
      'Activity log not found',
      { statusCode: 404, severity: ErrorSeverity.LOW }
    ));
  }

  const log = logs[0] as Record<string, unknown>;

  // Fetch user profile
  let userName = 'Unknown User';
  let userEmail = 'Unknown Email';

  if (log.user_id) {
    try {
      const profiles = await SecureServiceRoleHelpers.secureSelect(
        { ...operationContext, operation: 'admin_get_activity_user_profile' },
        'indb_auth_user_profiles',
        ['full_name', 'user_id'],
        { user_id: log.user_id as string }
      );

      if (profiles && profiles.length > 0) {
        userName = profiles[0].full_name || 'Unknown User';
      }

      const authResult = await SecureServiceRoleWrapper.executeSecureOperation(
        { ...operationContext, operation: 'admin_get_activity_user_email' },
        {
          table: 'auth.users',
          operationType: 'select',
          columns: ['email'],
          whereConditions: { id: log.user_id as string }
        },
        async () => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(log.user_id as string);
          return userData?.user?.email || null;
        }
      );
      if (authResult) {
        userEmail = authResult;
      }
    } catch (err) {
      // Ignore
    }
  }

  // Fetch related logs (same user)
  let relatedLogs: Record<string, unknown>[] = [];
  if (log.user_id) {
    try {
      relatedLogs = (await SecureServiceRoleWrapper.executeSecureOperation(
        { ...operationContext, operation: 'admin_get_related_activity_logs' },
        {
          table: 'indb_security_activity_logs',
          operationType: 'select',
          columns: ['*'],
          whereConditions: { user_id: log.user_id as string }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_security_activity_logs')
            .select('*')
            .eq('user_id', log.user_id as string)
            .neq('id', log.id as string)
            .order('created_at', { ascending: false })
            .limit(5);

          if (error) throw error;
          return data || [];
        }
      )) as Record<string, unknown>[];
    } catch (err) {
      // Ignore related logs error
    }
  }

  // Helper to map log
  const mapLog = (l: Record<string, unknown>) => {
    const details = (l.details as Record<string, unknown>) || {};
    return {
      id: l.id,
      user_id: l.user_id,
      user_name: userName, // Reusing same user info
      user_email: userEmail,
      event_type: l.event_type,
      action_description: (details.actionDescription as string) || (details.description as string) || null,
      target_type: (details.targetType as string) || (details.target_type as string) || null,
      target_id: (details.targetId as string) || (details.target_id as string) || null,
      ip_address: l.ip_address,
      user_agent: l.user_agent,
      metadata: l.details,
      success: details.success ?? true,
      error_message: (details.errorMessage as string) || (details.error_message as string),
      created_at: l.created_at
    };
  };

  const activityDetail = {
    ...mapLog(log),
    related_activities: relatedLogs.map(mapLog)
  };

  return formatSuccess({ activity: activityDetail });
});
