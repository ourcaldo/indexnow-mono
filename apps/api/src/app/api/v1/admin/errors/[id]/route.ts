import { SecureServiceRoleWrapper, supabaseAdmin, type Database } from '@indexnow/database';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminApiWrapper, formatError, createStandardError } from '@/lib/core/api-response-middleware';
import { formatSuccess, ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
  fetchSentryEvent,
  resolveSentryIssue,
  getSentryIssueUrl,
  getSentrySearchUrl,
  isSentryApiConfigured,
} from '@/lib/integrations/sentry-api';

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

      // Lazy-fetch Sentry issue_id if we have event_id but no issue_id
      let sentryIssueId = systemError.sentry_issue_id;
      const sentryEventId = systemError.sentry_event_id;

      if (sentryEventId && !sentryIssueId && isSentryApiConfigured()) {
        try {
          const sentryEvent = await fetchSentryEvent(sentryEventId);
          if (sentryEvent?.groupID) {
            sentryIssueId = sentryEvent.groupID;
            // Persist the issue_id for future lookups
            await supabaseAdmin
              .from('indb_system_error_logs')
              .update({ sentry_issue_id: sentryIssueId })
              .eq('id', errorId);
          }
        } catch {
          // Non-critical — don't fail the request
        }
      }

      // Backfill sentry_issue_id for other unresolved errors that have
      // a sentry_event_id but no sentry_issue_id yet (lazy-populated).
      // Without this, the sibling count below would miss them.
      if (sentryIssueId && isSentryApiConfigured()) {
        try {
          const { data: unlinked } = await supabaseAdmin
            .from('indb_system_error_logs')
            .select('id, sentry_event_id')
            .not('sentry_event_id', 'is', null)
            .is('sentry_issue_id', null)
            .is('resolved_at', null)
            .neq('id', errorId)
            .limit(20);

          if (unlinked && unlinked.length > 0) {
            await Promise.allSettled(
              unlinked.map(async (row) => {
                try {
                  if (!row.sentry_event_id) return;
                  const ev = await fetchSentryEvent(row.sentry_event_id);
                  if (ev?.groupID) {
                    await supabaseAdmin
                      .from('indb_system_error_logs')
                      .update({ sentry_issue_id: ev.groupID })
                      .eq('id', row.id);
                  }
                } catch { /* non-critical */ }
              })
            );
          }
        } catch { /* non-critical */ }
      }

      // Build Sentry URL — prefer direct issue link, fall back to search
      let sentryUrl: string | null = null;
      if (sentryIssueId) {
        sentryUrl = getSentryIssueUrl(sentryIssueId);
      } else {
        sentryUrl = getSentrySearchUrl(errorId);
      }

      // Count sibling errors sharing the same Sentry issue (for group-aware resolve)
      let siblingCount = 0;
      if (sentryIssueId) {
        const { count } = await supabaseAdmin
          .from('indb_system_error_logs')
          .select('id', { count: 'exact', head: true })
          .eq('sentry_issue_id', sentryIssueId)
          .neq('id', errorId)
          .is('resolved_at', null);
        siblingCount = count ?? 0;
      }

      // Get user info if user_id exists
      let userInfo = null;
      if (systemError.user_id) {
        const { data: user } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('email, full_name')
          .eq('user_id', systemError.user_id)
          .single();
        userInfo = user;
      }

      // Get resolver info if resolved_by exists
      let resolverInfo = null;
      if (systemError.resolved_by) {
        const { data: resolver } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('email, full_name')
          .eq('user_id', systemError.resolved_by)
          .single();
        resolverInfo = resolver;
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
        resolverInfo,
        relatedErrors: (relatedErrors || []) as Pick<SystemErrorLog, 'id' | 'error_type' | 'message' | 'severity' | 'created_at'>[],
        sentry: {
          eventId: sentryEventId,
          issueId: sentryIssueId,
          url: sentryUrl,
          siblingCount,
          configured: isSentryApiConfigured(),
        },
      };
    }
  );

  return formatSuccess(result);
});

const errorActionSchema = z.object({
  action: z.enum(['resolve', 'acknowledge', 'unresolve']),
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
      } else if (action === 'unresolve') {
        updateData.resolved_at = null;
        updateData.resolved_by = null;
      }

      // Update the primary error
      const { data, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .update(updateData)
        .eq('id', errorId)
        .select()
        .single();

      if (error) throw error;

      const updatedError = data as SystemErrorLog;
      let sentryResolved = false;
      let siblingResolved = 0;

      // On unresolve: reopen in Sentry
      if (action === 'unresolve') {
        const sentryIssueId = updatedError.sentry_issue_id;
        if (sentryIssueId && isSentryApiConfigured()) {
          const { unresolveSentryIssue } = await import('@/lib/integrations/sentry-api');
          await unresolveSentryIssue(sentryIssueId);
        }
        return {
          error: updatedError,
          action,
          updatedAt: new Date().toISOString(),
          sentry: { resolved: false, siblingResolved: 0 },
        };
      }

      // On resolve: sync to Sentry + resolve siblings sharing the same issue
      if (action === 'resolve') {
        const sentryIssueId = updatedError.sentry_issue_id;
        const sentryEventId = updatedError.sentry_event_id;

        // If we have an issue_id, resolve in Sentry and resolve all siblings
        if (sentryIssueId && isSentryApiConfigured()) {
          // Resolve the Sentry issue
          sentryResolved = await resolveSentryIssue(sentryIssueId);

          // Resolve all unresolved sibling errors sharing the same Sentry issue
          const { data: resolvedSiblings } = await supabaseAdmin
            .from('indb_system_error_logs')
            .update({
              resolved_at: updateData.resolved_at,
              resolved_by: adminUser.id,
            })
            .eq('sentry_issue_id', sentryIssueId)
            .neq('id', errorId)
            .is('resolved_at', null)
            .select('id');

          siblingResolved = resolvedSiblings?.length ?? 0;
        } else if (sentryEventId && isSentryApiConfigured()) {
          // Try to fetch the issue_id from Sentry event, then resolve
          try {
            const sentryEvent = await fetchSentryEvent(sentryEventId);
            if (sentryEvent?.groupID) {
              // Persist issue_id for future
              await supabaseAdmin
                .from('indb_system_error_logs')
                .update({ sentry_issue_id: sentryEvent.groupID })
                .eq('id', errorId);

              sentryResolved = await resolveSentryIssue(sentryEvent.groupID);

              // Resolve siblings
              const { data: resolvedSiblings } = await supabaseAdmin
                .from('indb_system_error_logs')
                .update({
                  resolved_at: updateData.resolved_at,
                  resolved_by: adminUser.id,
                  sentry_issue_id: sentryEvent.groupID,
                })
                .eq('sentry_issue_id', sentryEvent.groupID)
                .neq('id', errorId)
                .is('resolved_at', null)
                .select('id');

              siblingResolved = resolvedSiblings?.length ?? 0;
            }
          } catch {
            // Non-critical
          }
        }
      }

      return {
        error: updatedError,
        action,
        updatedAt: new Date().toISOString(),
        sentry: { resolved: sentryResolved, siblingResolved },
      };
    }
  );

  return formatSuccess(result);
});
