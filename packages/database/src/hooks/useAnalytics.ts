'use client';

import { useCallback } from 'react';
import { trackEvent, identifyUser, resetUser, trackError, AnalyticsTraits } from '../utils/analytics';
import { type Json } from '@indexnow/shared';

/**
 * Custom hook for using analytics in React components
 */
export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, Json>) => {
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
