import { NextRequest, NextResponse } from 'next/server';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import {
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

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
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
  const userIds = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean))) as string[];
  const profileMap = new Map<string, any>();
  const emailMap = new Map<string, string>();

  if (userIds.length > 0) {
    try {
      const profiles = await SecureServiceRoleWrapper.executeSecureOperation(
        { ...operationContext, operation: 'admin_enrich_activity_profiles' },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['user_id', 'full_name'],
        },
        async () => {
          const { data } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          return data;
        }
      );

      profiles?.forEach(p => profileMap.set(p.user_id, p));

      await Promise.all(userIds.map(async (uid) => {
        try {
          const email = await SecureServiceRoleWrapper.executeSecureOperation(
            { ...operationContext, operation: 'admin_enrich_activity_email' },
            {
              table: 'auth.users',
              operationType: 'select',
              columns: ['email'],
              whereConditions: { id: uid }
            },
            async () => {
              const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
              return data?.user?.email || null;
            }
          );
          if (email) {
            emailMap.set(uid, email);
          }
        } catch (e) { /* ignore */ }
      }));
    } catch (e) { /* ignore */ }
  }

  const enrichedLogs: EnrichedActivityLog[] = logs.map(log => {
    let userName = 'Unknown User';
    let userEmail = 'Unknown Email';

    if (log.user_id) {
      const p = profileMap.get(log.user_id);
      if (p?.full_name) userName = p.full_name;

      const e = emailMap.get(log.user_id);
      if (e) userEmail = e;
    }

    // Safely cast details (which replaces metadata/description)
    const details = (log.details as Record<string, any>) || {};

    return {
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
    };
  });

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
