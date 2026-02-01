/**
 * Analytics and Monitoring Utilities
 */

import { type Json } from '../types/common/Json';
import { logger } from './logger';

export interface AnalyticsTraits extends Record<string, Json | undefined> {
  email?: string;
  username?: string;
  name?: string;
}

/**
 * Initialize analytics providers
 */
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;
  logger.info('Initializing analytics providers');
  // Implementation will depend on the app's specific setup
}

/**
 * Track a page view
 */
export function trackPageView(path?: string) {
  if (typeof window === 'undefined') return;
  const url = path || window.location.pathname;
  logger.info(`Page View: ${url}`);
}

/**
 * Track a custom event
 */
export function trackEvent(event: string, properties?: Record<string, Json>) {
  logger.info(properties || {}, `Event: ${event}`);
}

/**
 * Identify a user
 */
export function identifyUser(userId: string, traits?: AnalyticsTraits) {
  logger.info(traits || {}, `Identify User: ${userId}`);
}

/**
 * Reset user identity
 */
export function resetUser() {
  logger.info('Reset User');
}

/**
 * Track an error
 */
export function trackError(error: unknown, context?: Record<string, Json>) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(context || {}, message || 'An unexpected error occurred');
}
