import { Json } from '../types/database';

interface PostHogWithDebug {
  debug: (enabled?: boolean) => void;
}
import posthog from 'posthog-js';
import { getAnalyticsConfig, getSubdomainContext } from './config';

export function initializePosthog() {
  if (typeof window === 'undefined') return;

  const config = getAnalyticsConfig();

  if (!config.posthog.enabled || !config.posthog.apiKey) {
    return;
  }

  posthog.init(config.posthog.apiKey, {
    api_host: config.posthog.apiHost,
    loaded: (ph) => {
      if (config.debug) {
        // Safe cast to access debug method if not in type definition
        (ph as PostHogWithDebug).debug();
      }
    },
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  });

  posthog.register({
    subdomain: getSubdomainContext(),
  });
}

export function getPosthogClient() {
  const config = getAnalyticsConfig();
  
  if (!config.posthog.enabled) return null;

  return posthog;
}

export function trackPosthogEvent(event: string, properties?: Record<string, Json>) {
  const config = getAnalyticsConfig();
  
  if (!config.posthog.enabled) return;

  posthog.capture(event, {
    ...properties,
    subdomain: getSubdomainContext(),
  });
}

export function identifyPosthogUser(userId: string, properties?: Record<string, Json>) {
  const config = getAnalyticsConfig();
  
  if (!config.posthog.enabled) return;

  posthog.identify(userId, properties);
}

export function resetPosthogUser() {
  const config = getAnalyticsConfig();
  
  if (!config.posthog.enabled) return;

  posthog.reset();
}
