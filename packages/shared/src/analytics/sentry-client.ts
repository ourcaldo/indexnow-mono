import { type Json } from '../types/common/Json';
import * as Sentry from '@sentry/nextjs';
import { replayIntegration } from '@sentry/browser';
import { getAnalyticsConfig, getSubdomainContext } from './config';

export function initializeSentry() {
  if (typeof window === 'undefined') return;

  const config = getAnalyticsConfig();

  if (!config.sentry.enabled || !config.sentry.dsn) {
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      replayIntegration(),
    ],
    tracesSampleRate: config.sentry.traceSampleRate,
    replaysSessionSampleRate: config.sentry.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.sentry.replaysOnErrorSampleRate,
    beforeSend(event) {
      if (event.contexts) {
        event.contexts.subdomain = {
          name: getSubdomainContext(),
        };
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: Record<string, Json>) {
  const config = getAnalyticsConfig();
  
  if (!config.sentry.enabled) return;

  Sentry.captureException(error, {
    extra: {
      ...context,
      subdomain: getSubdomainContext(),
    },
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, Json>) {
  const config = getAnalyticsConfig();
  
  if (!config.sentry.enabled) return;

  Sentry.captureMessage(message, {
    level,
    extra: {
      ...context,
      subdomain: getSubdomainContext(),
    },
  });
}

export function setSentryUser(user: { id: string; email?: string; username?: string } | null) {
  const config = getAnalyticsConfig();
  
  if (!config.sentry.enabled) return;

  Sentry.setUser(user);
}

export function clearSentryUser() {
  setSentryUser(null);
}
