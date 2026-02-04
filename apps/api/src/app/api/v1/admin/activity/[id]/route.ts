import { NextRequest, NextResponse } from 'next/server';
import { 
  adminApiWrapper, 
  formatSuccess, 
  formatError,
  createStandardError,
  type ActivityDetail,
  type EnrichedActivityLog
} from '@indexnow/shared';
import { ErrorType, ErrorSeverity, logger } from '@indexnow/shared'; // Check imports for logger/errors
import { 
  SecureServiceRoleWrapper, 
  SecureServiceRoleHelpers, 
  supabaseAdmin,
  type SecurityActivityLog
} from '@indexnow/database';

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<{ id: string }> }
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
    return createStandardError(
      ErrorType.NOT_FOUND,
      'Activity log not found',
      404,
      ErrorSeverity.LOW
    );
  }

  const log = logs[0] as SecurityActivityLog;

  // Fetch user profile
  let userName = 'Unknown User';
  let userEmail = 'Unknown Email';

  if (log.user_id) {
    try {
        const profiles = await SecureServiceRoleHelpers.secureSelect(
            { ...operationContext, operation: 'admin_get_activity_user_profile' },
            'indb_auth_user_profiles',
            ['full_name', 'user_id'],
            { user_id: log.user_id }
        );
        
        if (profiles && profiles.length > 0) {
            userName = profiles[0].full_name || 'Unknown User';
        }

        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(log.user_id);
        if (userData?.user?.email) {
            userEmail = userData.user.email;
        }
    } catch (err) {
        // Ignore
    }
  }

  // Fetch related logs (same user)
  let relatedLogs: SecurityActivityLog[] = [];
  if (log.user_id) {
      try {
        relatedLogs = (await SecureServiceRoleWrapper.executeSecureOperation(
            { ...operationContext, operation: 'admin_get_related_activity_logs' },
            {
                table: 'indb_security_activity_logs',
                operationType: 'select',
                columns: ['*'],
                whereConditions: { user_id: log.user_id }
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_security_activity_logs')
                    .select('*')
                    .eq('user_id', log.user_id!)
                    .neq('id', log.id)
                    .order('created_at', { ascending: false })
                    .limit(5);
                
                if (error) throw error;
                return data || [];
            }
        )) as SecurityActivityLog[];
      } catch (err) {
          // Ignore related logs error
      }
  }

  // Helper to map log
  const mapLog = (l: SecurityActivityLog): EnrichedActivityLog => {
      const details = (l.details as Record<string, any>) || {};
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

  const activityDetail: ActivityDetail = {
      ...mapLog(log),
      related_activities: relatedLogs.map(mapLog)
  };

  return formatSuccess({ activity: activityDetail });
});
