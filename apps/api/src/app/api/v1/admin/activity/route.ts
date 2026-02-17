import { NextRequest, NextResponse } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { adminApiWrapper, createStandardError } from '@/lib/core/api-response-middleware';
import {
  formatSuccess,
  formatError,
  apiRequestSchemas,
  escapeLikePattern,
  type EnrichedActivityLog,
  type GetActivityLogsResponse,
  type DbSecurityActivityLog,
  ErrorType,
  ErrorSeverity,
} from '@indexnow/shared';
import {
  SecureServiceRoleWrapper,
  SecureServiceRoleHelpers,
  supabaseAdmin,
} from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';
import { batchGetUserEmails } from '@/lib/core/batch-user-emails';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  // Validate query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validationResult = apiRequestSchemas.adminActivityQuery.safeParse(searchParams);

  if (!validationResult.success) {
    const error = await createStandardError(
      ErrorType.VALIDATION,
      'Invalid query parameters',
      { statusCode: 400, severity: ErrorSeverity.LOW }
    );
    return formatError(error);
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
    metadata: { days, limit, page, userId: userId ?? null, searchTerm: searchTerm ?? null, eventType }
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
        // Search in event_type and user_agent (escaped to prevent filter injection)
        const escaped = escapeLikePattern(searchTerm);
        query = query.or(`event_type.ilike.%${escaped}%,user_agent.ilike.%${escaped}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    }
  );

  const logs = (logsResult.data || []) as DbSecurityActivityLog[];
  const count = logsResult.count || 0;

  // Enrich logs with user data
  const userIds = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean))) as string[];
  const profileMap = new Map<string, { user_id: string; full_name: string | null }>();
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
            .in('user_id', userIds)
            .limit(200);
          return data;
        }
      );

      profiles?.forEach(p => profileMap.set(p.user_id, p));

      // Batch fetch emails (single RPC call instead of N individual lookups)
      const emails = await batchGetUserEmails(userIds);
      emails.forEach((email, uid) => emailMap.set(uid, email));
    } catch (e) {
      logger.warn({ error: e instanceof Error ? e.message : String(e) }, 'Failed to enrich activity logs with user data');
    }
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
    const details = (log.details as Record<string, unknown>) || {};

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
      success: (details.success as boolean) ?? true,
      error_message: (details.errorMessage as string) || (details.error_message as string),
      created_at: log.created_at
    };
  });

  const totalPages = Math.ceil(count / limit);
  const response: GetActivityLogsResponse = {
    logs: enrichedLogs,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      offset,
    }
  };

  return formatSuccess(response);
});
