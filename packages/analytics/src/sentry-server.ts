/**
 * Sentry Server-Side Configuration
 * Tracks errors in API routes, server actions, and middleware
 */

import * as Sentry from '@sentry/nextjs';
import { getAnalyticsConfig } from './config';

let isInitialized = false;

/**
 * Initialize Sentry for server-side error tracking
 */
export function initializeServerSentry() {
  if (isInitialized) return;
  
  const config = getAnalyticsConfig();
  
  if (!config.sentry.enabled || !config.sentry.dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment,
      tracesSampleRate: config.sentry.traceSampleRate,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      integrations: [],
      beforeSend(event) {
        if (event.contexts) {
          event.contexts.runtime = { name: 'server' };
        }
        return event;
      },
    });

    isInitialized = true;
  } catch (error) {
    console.error('[Sentry] Server-side initialization failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Track server-side error with searchable tags.
 * Returns the Sentry event_id string if captured, or undefined.
 */
export function trackServerError(error: Error, context?: Record<string, unknown>): string | undefined {
  const config = getAnalyticsConfig();
  if (!config.sentry.enabled) return undefined;

  try {
    let eventId: string | undefined;
    Sentry.withScope((scope) => {
      // Set searchable tags (indexed by Sentry, supports search queries)
      if (context?.errorId) scope.setTag('errorId', String(context.errorId));
      if (context?.errorType) scope.setTag('errorType', String(context.errorType));
      if (context?.severity) scope.setTag('severity', String(context.severity));
      if (context?.endpoint) scope.setTag('endpoint', String(context.endpoint));
      if (context?.statusCode) scope.setTag('statusCode', String(context.statusCode));

      // Keep the full context as extras for debugging
      scope.setExtras({ ...context, runtime: 'server' });

      eventId = Sentry.captureException(error);
    });
    return eventId;
  } catch (err) {
    // Silent fail
    return undefined;
  }
}

/**
 * Track server-side message
 */
export function trackServerMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  const config = getAnalyticsConfig();
  if (!config.sentry.enabled) return;

  try {
    Sentry.captureMessage(message, {
      level,
      extra: { ...context, runtime: 'server' },
    });
  } catch (err) {
    // Silent fail
  }
}

/**
 * Set server-side user context
 */
export function setServerSentryUser(user: { id: string; email?: string; username?: string }) {
  const config = getAnalyticsConfig();
  if (!config.sentry.enabled) return;

  try {
    Sentry.setUser(user);
  } catch (err) {
    // Silent fail
  }
}

/**
 * Clear server-side user context
 */
export function clearServerSentryUser() {
  const config = getAnalyticsConfig();
  if (!config.sentry.enabled) return;

  try {
    Sentry.setUser(null);
  } catch (err) {
    // Silent fail
  }
}
