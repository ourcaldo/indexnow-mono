/**
 * Sentry REST API client for bidirectional issue sync.
 *
 * Used by:
 *  - Admin error action API  → resolve/unresolve issues in Sentry
 *  - Sentry webhook endpoint → resolve/unresolve errors in our DB
 *  - ErrorSlideOver UI       → "Open in Sentry" button link
 *
 * Requires SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT env vars.
 */

import { logger } from '../monitoring/error-handling';

const SENTRY_BASE = 'https://sentry.io/api/0';

interface SentryConfig {
  authToken: string;
  org: string;
  project: string;
}

function getSentryConfig(): SentryConfig | null {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!authToken || !org || !project) return null;
  return { authToken, org, project };
}

async function sentryFetch(path: string, options: RequestInit = {}) {
  const config = getSentryConfig();
  if (!config) throw new Error('Sentry API not configured (missing SENTRY_AUTH_TOKEN, SENTRY_ORG, or SENTRY_PROJECT)');

  const url = `${SENTRY_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    logger.warn({ url, status: response.status, body: text }, '[SentryAPI] Request failed');
    throw new Error(`Sentry API error: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Fetch a Sentry event by its event ID.
 * Returns the event data including the groupID (issue ID).
 */
export async function fetchSentryEvent(eventId: string): Promise<{
  eventID: string;
  groupID: string;
  title: string;
  message: string;
  dateCreated: string;
  tags: Array<{ key: string; value: string }>;
  context: Record<string, unknown>;
} | null> {
  const config = getSentryConfig();
  if (!config) return null;

  try {
    const data = await sentryFetch(`/projects/${config.org}/${config.project}/events/${eventId}/`);
    return data;
  } catch (err) {
    logger.warn({ eventId, error: err instanceof Error ? err.message : String(err) }, '[SentryAPI] Failed to fetch event');
    return null;
  }
}

/**
 * Resolve a Sentry issue by its issue ID.
 * PUT /api/0/issues/{issue_id}/  →  { "status": "resolved" }
 */
export async function resolveSentryIssue(issueId: string): Promise<boolean> {
  const config = getSentryConfig();
  if (!config) return false;

  try {
    await sentryFetch(`/issues/${issueId}/`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
    });
    logger.info({ issueId }, '[SentryAPI] Issue resolved');
    return true;
  } catch (err) {
    logger.warn({ issueId, error: err instanceof Error ? err.message : String(err) }, '[SentryAPI] Failed to resolve issue');
    return false;
  }
}

/**
 * Unresolve (reopen) a Sentry issue by its issue ID.
 * PUT /api/0/issues/{issue_id}/  →  { "status": "unresolved" }
 */
export async function unresolveSentryIssue(issueId: string): Promise<boolean> {
  const config = getSentryConfig();
  if (!config) return false;

  try {
    await sentryFetch(`/issues/${issueId}/`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'unresolved' }),
    });
    logger.info({ issueId }, '[SentryAPI] Issue unresolved');
    return true;
  } catch (err) {
    logger.warn({ issueId, error: err instanceof Error ? err.message : String(err) }, '[SentryAPI] Failed to unresolve issue');
    return false;
  }
}

/**
 * Build a direct URL to view the Sentry issue in the browser.
 * Format: https://sentry.io/organizations/{org}/issues/{issueId}/
 */
export function getSentryIssueUrl(issueId: string): string | null {
  const config = getSentryConfig();
  if (!config) return null;
  return `https://sentry.io/organizations/${config.org}/issues/${issueId}/`;
}

/**
 * Build a search URL to find issues matching a specific errorId tag.
 * Useful as a fallback when sentry_issue_id is not yet populated.
 */
export function getSentrySearchUrl(errorId: string): string | null {
  const config = getSentryConfig();
  if (!config) return null;
  return `https://sentry.io/organizations/${config.org}/issues/?project=${config.project}&query=errorId%3A${errorId}`;
}

/**
 * Check if Sentry API integration is configured.
 */
export function isSentryApiConfigured(): boolean {
  return getSentryConfig() !== null;
}
