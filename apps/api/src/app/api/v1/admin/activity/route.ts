import { NextRequest, NextResponse } from 'next/server';
import { 
  adminApiWrapper, 
  formatSuccess, 
  formatError, 
  apiRequestSchemas,
  type EnrichedActivityLog,
  type GetActivityLogsResponse
} from '@indexnow/shared';
import { 
  SecureServiceRoleWrapper, 
  SecureServiceRoleHelpers, 
  supabaseAdmin,
  type SecurityActivityLog
} from '@indexnow/database';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
  // Validate query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validationResult = apiRequestSchemas.adminActivityQuery.safeParse(searchParams);
  
  if (!validationResult.success) {
    return formatError('Invalid query parameters', 400, validationResult.error.format());
  }

  const { 
    days = 7, 
    limit = 100, 
    page = 1, 
    user: userId, 
    search: searchTerm, 
    event_type: eventType 
  } = validationResult.data;

  const offset = (page - 1) * limit;
  
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - days);

  // Define context for logging
  const operationContext = {
    userId: adminUser.id,
    operation: 'admin_get_activity_logs',
    reason: 'Admin fetching activity logs',
    source: 'admin/activity',
    metadata: { days, limit, page, userId, searchTerm, eventType }
  };

  // Fetch logs with count
  const logsResult = await SecureServiceRoleWrapper.executeSecureOperation(
    operationContext,
    {
      table: 'indb_security_activity_logs',
      operationType: 'select',
      columns: ['*']
    },
    async () => {
      let query = supabaseAdmin
        .from('indb_security_activity_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (eventType && eventType !== 'all') {
        query = query.eq('event_type', eventType);
      }

      if (searchTerm) {
        // Search in event_type and user_agent
        // Note: searching inside JSONB 'details' for description is possible but complex with simple OR
        query = query.or(`event_type.ilike.%${searchTerm}%,user_agent.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    }
  );

  const logs = (logsResult.data || []) as SecurityActivityLog[];
  const count = logsResult.count || 0;

  // Enrich logs with user data
  const enrichedLogs: EnrichedActivityLog[] = [];

  for (const log of logs) {
    let userName = 'Unknown User';
    let userEmail = 'Unknown Email';

    if (log.user_id) {
        // Fetch user profile
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

            // Fetch user email (from auth.users)
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(log.user_id);
            if (userData?.user?.email) {
                userEmail = userData.user.email;
            }
        } catch (err) {
            // Ignore error, keep unknown
        }
    }

    // Safely cast details (which replaces metadata/description)
    const details = (log.details as Record<string, any>) || {};

    enrichedLogs.push({
        id: log.id,
        user_id: log.user_id,
        user_name: userName,
        user_email: userEmail,
        event_type: log.event_type,
        action_description: (details.actionDescription as string) || (details.description as string) || null,
        target_type: (details.targetType as string) || (details.target_type as string) || null,
        target_id: (details.targetId as string) || (details.target_id as string) || null,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        metadata: log.details, // Use details as metadata
        success: details.success ?? true,
        error_message: (details.errorMessage as string) || (details.error_message as string),
        created_at: log.created_at
    });
  }

  const response: GetActivityLogsResponse = {
    logs: enrichedLogs,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };

  return formatSuccess(response);
});
