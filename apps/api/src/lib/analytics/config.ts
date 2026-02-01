/**
 * Analytics Configuration
 * Environment-based configuration for all analytics providers
 * Only enables analytics when environment variables are populated
 */

import { AppConfig } from '@indexnow/shared';
import type { AnalyticsConfig, Subdomain } from './types';

/**
 * Get analytics configuration from environment variables
 * Only enables analytics when env vars are populated
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const { ga4, posthog, sentry } = AppConfig.monitoring;
  const isDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

  return {
    ga4: {
      enabled: Boolean(ga4.measurementId),
      measurementId: ga4.measurementId,
    },
    gtm: {
      enabled: Boolean(process.env.NEXT_PUBLIC_GTM_CONTAINER_ID),
      containerId: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
    },
    customerio: {
      enabled: Boolean(process.env.NEXT_PUBLIC_CUSTOMERIO_SITE_ID),
      siteId: process.env.NEXT_PUBLIC_CUSTOMERIO_SITE_ID,
    },
    sentry: {
      enabled: Boolean(sentry.dsn),
      dsn: sentry.dsn,
      environment: sentry.environment,
      traceSampleRate: sentry.traceSampleRate,
      replaysSessionSampleRate: sentry.replaysSessionRate,
      replaysOnErrorSampleRate: sentry.replaysErrorRate,
    },
    posthog: {
      enabled: Boolean(posthog.key),
      apiKey: posthog.key,
      apiHost: posthog.host,
    },
    debug: isDebug,
  };
}

/**
 * Get current subdomain for analytics context
 */
export function getSubdomainContext(): Subdomain {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('dashboard')) return 'dashboard';
  if (hostname.includes('backend')) return 'backend';
  if (hostname.includes('api')) return 'api';
  
  return 'www';
}
