import { type Json } from '../types/common/Json';
import { getAnalyticsClient } from './analytics-client';
import { initializeSentry, captureException, captureMessage, setSentryUser, clearSentryUser } from './sentry-client';
import { initializePosthog, trackPosthogEvent, identifyPosthogUser, resetPosthogUser } from './posthog-client';
import { getAnalyticsConfig, getSubdomainContext } from './config';

export function initializeAnalytics() {
  if (typeof window === 'undefined') return;

  initializeSentry();
  initializePosthog();
}

export function trackPageView(path?: string) {
  const analytics = getAnalyticsClient();
  const config = getAnalyticsConfig();

  if (analytics) {
    analytics.page({
      url: path || window.location.pathname,
      subdomain: getSubdomainContext(),
    });
  }

  if (config.posthog.enabled) {
    trackPosthogEvent('$pageview', {
      url: path || window.location.pathname,
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, Json>) {
  const analytics = getAnalyticsClient();
  const config = getAnalyticsConfig();

  const enrichedProperties = {
    ...properties,
    subdomain: getSubdomainContext(),
  };

  if (analytics) {
    analytics.track(event, enrichedProperties);
  }

  if (config.posthog.enabled) {
    trackPosthogEvent(event, enrichedProperties);
  }
}

export function identifyUser(userId: string, traits?: Record<string, Json>) {
  const analytics = getAnalyticsClient();
  const config = getAnalyticsConfig();

  if (analytics) {
    analytics.identify(userId, traits);
  }

  if (config.sentry.enabled) {
    setSentryUser({
      id: userId,
      email: typeof traits?.email === 'string' ? traits.email : undefined,
      username: typeof traits?.username === 'string' ? traits.username : undefined,
    });
  }

  if (config.posthog.enabled) {
    identifyPosthogUser(userId, traits);
  }
}

export function resetUser() {
  const analytics = getAnalyticsClient();
  const config = getAnalyticsConfig();

  if (analytics) {
    analytics.reset();
  }

  if (config.sentry.enabled) {
    clearSentryUser();
  }

  if (config.posthog.enabled) {
    resetPosthogUser();
  }
}

export function trackError(error: Error, context?: Record<string, Json>) {
  const config = getAnalyticsConfig();

  if (config.sentry.enabled) {
    captureException(error, context);
  }

  trackEvent('error', {
    error: error.message,
    stack: error.stack || null,
    ...context,
  });
}

export { getAnalyticsConfig, getSubdomainContext };
export { captureException, captureMessage, setSentryUser, clearSentryUser };
export { trackPosthogEvent, identifyPosthogUser, resetPosthogUser };
export * from './sentry-server';
export * from './types';
