import type { AnalyticsConfig, Subdomain } from './types';
import { AppConfig } from '@indexnow/shared';

export function getAnalyticsConfig(): AnalyticsConfig {
  // Use centralized AppConfig for validated values (sentry, posthog, ga4)
  const { sentry, posthog, ga4 } = AppConfig.monitoring;

  // GTM and Customer.io are not in AppConfig — read from env directly
  const gtmContainerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  const customerioSiteId = process.env.NEXT_PUBLIC_CUSTOMERIO_SITE_ID;
  const isDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

  return {
    ga4: {
      enabled: Boolean(ga4.measurementId),
      measurementId: ga4.measurementId,
    },
    gtm: {
      enabled: Boolean(gtmContainerId),
      containerId: gtmContainerId,
    },
    customerio: {
      enabled: Boolean(customerioSiteId),
      siteId: customerioSiteId,
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

export function getSubdomainContext(): Subdomain {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('dashboard')) return 'dashboard';
  if (hostname.includes('backend')) return 'backend';
  if (hostname.includes('api')) return 'api';
  
  return 'www';
}
