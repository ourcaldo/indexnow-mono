'use client';

import { useCallback } from 'react';
import { type Json } from '@indexnow/shared';
import { trackEvent, identifyUser, resetUser, trackError, AnalyticsTraits, TrackEventProperties } from '@indexnow/analytics';

/**
 * Custom hook for using analytics in React components
 * @internal Not yet consumed by any app — reserved for future use
 */
export function useAnalytics() {
  const track = useCallback((event: string, properties?: TrackEventProperties) => {
    trackEvent(event, properties);
  }, []);

  const identify = useCallback((userId: string, traits?: AnalyticsTraits) => {
    identifyUser(userId, traits);
  }, []);

  const reset = useCallback(() => {
    resetUser();
  }, []);

  const error = useCallback((error: Error, context?: Record<string, Json>) => {
    trackError(error, context);
  }, []);

  return {
    track,
    identify,
    reset,
    error,
  };
}
