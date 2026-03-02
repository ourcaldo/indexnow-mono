import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';
import crypto from 'crypto';

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
export async function POST(request: NextRequest) {
  const endpoint = '/api/v1/webhooks/sentry';

  try {
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
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(bodyText);
    const action = payload.action as string;
    const sentryResource = request.headers.get('sentry-hook-resource');

    logger.info(
      { endpoint, action, resource: sentryResource, issueId: payload.data?.issue?.id },
      '[SentryWebhook] Received webhook'
    );

    // We only care about issue events
    if (sentryResource !== 'issue') {
      return NextResponse.json({ ok: true, skipped: 'not an issue event' });
    }

    const issue = payload.data?.issue;
    if (!issue?.id) {
      return NextResponse.json({ ok: true, skipped: 'no issue ID' });
    }

    const sentryIssueId = String(issue.id);

    if (action === 'resolved') {
      // Resolve all unresolved errors matching this Sentry issue
      const { data: updated, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: null, // null = resolved by Sentry (not a specific admin)
        })
        .eq('sentry_issue_id', sentryIssueId)
        .is('resolved_at', null)
        .select('id');

      if (error) {
        logger.error({ endpoint, sentryIssueId, error: error.message }, '[SentryWebhook] DB update failed');
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      const resolvedCount = updated?.length ?? 0;
      logger.info(
        { endpoint, sentryIssueId, resolvedCount },
        `[SentryWebhook] Resolved ${resolvedCount} errors from Sentry`
      );

      return NextResponse.json({
        ok: true,
        action: 'resolved',
        sentryIssueId,
        resolvedCount,
      });
    }

    if (action === 'created' || action === 'unresolved') {
      // Unresolve — clear resolved_at for all errors matching this issue
      const { data: updated, error } = await supabaseAdmin
        .from('indb_system_error_logs')
        .update({
          resolved_at: null,
          resolved_by: null,
        })
        .eq('sentry_issue_id', sentryIssueId)
        .not('resolved_at', 'is', null)
        .select('id');

      if (error) {
        logger.error({ endpoint, sentryIssueId, error: error.message }, '[SentryWebhook] DB update failed');
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      const unresolvedCount = updated?.length ?? 0;
      logger.info(
        { endpoint, sentryIssueId, unresolvedCount },
        `[SentryWebhook] Unresolved ${unresolvedCount} errors from Sentry`
      );

      return NextResponse.json({
        ok: true,
        action: 'unresolved',
        sentryIssueId,
        unresolvedCount,
      });
    }

    // Other actions (ignored, assigned, etc.) — acknowledge but don't act
    return NextResponse.json({ ok: true, skipped: `unhandled action: ${action}` });
  } catch (err) {
    logger.error(
      { endpoint, error: err instanceof Error ? err.message : String(err) },
      '[SentryWebhook] Unexpected error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
