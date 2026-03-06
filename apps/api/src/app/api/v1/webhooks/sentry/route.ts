import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';
import { publicApiWrapper, formatError, createStandardError } from '@/lib/core/api-response-middleware';
import { formatSuccess, ErrorType, ErrorSeverity } from '@indexnow/shared';
import crypto from 'crypto';
import { z } from 'zod';

const sentryWebhookSchema = z.object({
  action: z.string(),
  data: z.object({
    issue: z.object({
      id: z.union([z.string(), z.number()]),
    }).optional(),
  }).optional(),
});

/**
 * POST /api/v1/webhooks/sentry
 *
 * Sentry webhook endpoint for bidirectional issue sync.
 * When an issue is resolved/unresolved in Sentry, this updates all matching
 * error rows in our DB.
 *
 * Sentry sends webhooks for: issue.resolved, issue.unresolved, issue.ignored, etc.
 *
 * Setup in Sentry:
 *   Settings → Integrations → Webhooks → Add Webhook
 *   URL: https://api.yourdomain.com/api/v1/webhooks/sentry
 *   Secret: (set SENTRY_WEBHOOK_SECRET env var to match)
 */
interface SentryWebhookResult {
  ok: boolean;
  skipped?: string;
  action?: string;
  sentryIssueId?: string;
  resolvedCount?: number;
  unresolvedCount?: number;
}

export const POST = publicApiWrapper<SentryWebhookResult>(async (request: NextRequest) => {
  const endpoint = '/api/v1/webhooks/sentry';

  // Verify Sentry webhook signature (if secret is configured)
  const webhookSecret = process.env.SENTRY_WEBHOOK_SECRET;
  const sentrySignature = request.headers.get('sentry-hook-signature');

  const bodyText = await request.text();

  if (webhookSecret && sentrySignature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    if (sentrySignature !== expectedSignature) {
      logger.warn({ endpoint }, '[SentryWebhook] Invalid signature — rejecting');
      return formatError(await createStandardError(
        ErrorType.AUTHENTICATION,
        'Invalid webhook signature',
        { statusCode: 401, severity: ErrorSeverity.HIGH }
      ));
    }
  }

  const parseResult = sentryWebhookSchema.safeParse(JSON.parse(bodyText));
  if (!parseResult.success) {
    logger.warn({ errors: parseResult.error.flatten().fieldErrors }, '[SentryWebhook] Invalid payload structure');
    return formatError(await createStandardError(
      ErrorType.VALIDATION,
      'Invalid webhook payload structure',
      { statusCode: 400, severity: ErrorSeverity.MEDIUM }
    ));
  }
  const payload = parseResult.data;
  const action = payload.action;
  const sentryResource = request.headers.get('sentry-hook-resource');

  logger.info(
    { endpoint, action, resource: sentryResource, issueId: payload.data?.issue?.id },
    '[SentryWebhook] Received webhook'
  );

  // We only care about issue events
  if (sentryResource !== 'issue') {
    return formatSuccess({ ok: true, skipped: 'not an issue event' });
  }

  const issue = payload.data?.issue;
  if (!issue?.id) {
    return formatSuccess({ ok: true, skipped: 'no issue ID' });
  }

  const sentryIssueId = String(issue.id);

  if (action === 'resolved') {
    const result = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system:sentry-webhook',
        operation: 'sentry_resolve_errors',
        reason: 'Sentry webhook resolved issue',
        source: endpoint,
        metadata: { sentryIssueId, action }
      },
      {
        table: 'indb_system_error_logs',
        operationType: 'update',
        data: { resolved_at: 'timestamp', resolved_by: null },
        whereConditions: { sentry_issue_id: sentryIssueId }
      },
      async () => {
        const { data: updated, error } = await supabaseAdmin
          .from('indb_system_error_logs')
          .update({
            resolved_at: new Date().toISOString(),
            resolved_by: null,
          })
          .eq('sentry_issue_id', sentryIssueId)
          .is('resolved_at', null)
          .select('id');

        if (error) throw error;

        const resolvedCount = updated?.length ?? 0;
        logger.info(
          { endpoint, sentryIssueId, resolvedCount },
          `[SentryWebhook] Resolved ${resolvedCount} errors from Sentry`
        );

        return { ok: true, action: 'resolved', sentryIssueId, resolvedCount };
      }
    );

    return formatSuccess(result);
  }

  if (action === 'created' || action === 'unresolved') {
    const result = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system:sentry-webhook',
        operation: 'sentry_unresolve_errors',
        reason: 'Sentry webhook unresolved issue',
        source: endpoint,
        metadata: { sentryIssueId, action }
      },
      {
        table: 'indb_system_error_logs',
        operationType: 'update',
        data: { resolved_at: null, resolved_by: null },
        whereConditions: { sentry_issue_id: sentryIssueId }
      },
      async () => {
        const { data: updated, error } = await supabaseAdmin
          .from('indb_system_error_logs')
          .update({
            resolved_at: null,
            resolved_by: null,
          })
          .eq('sentry_issue_id', sentryIssueId)
          .not('resolved_at', 'is', null)
          .select('id');

        if (error) throw error;

        const unresolvedCount = updated?.length ?? 0;
        logger.info(
          { endpoint, sentryIssueId, unresolvedCount },
          `[SentryWebhook] Unresolved ${unresolvedCount} errors from Sentry`
        );

        return { ok: true, action: 'unresolved', sentryIssueId, unresolvedCount };
      }
    );

    return formatSuccess(result);
  }

  // Other actions (ignored, assigned, etc.) — acknowledge but don't act
  return formatSuccess({ ok: true, skipped: `unhandled action: ${action}` });
});
