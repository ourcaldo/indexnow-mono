/**
 * Frontend Activity Logging Hook
 * Provides convenient methods to log user activities from client-side
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { type Json, ACTIVITY_ENDPOINTS, logger } from '@indexnow/shared';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';

// Module-level dedup: prevents duplicate page views across multiple hook instances
const loggedPageViews = new Set<string>();

interface ActivityLogRequest {
  eventType: string;
  actionDescription: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, Json>;
}

export interface UseActivityLoggerReturn {
  logActivity: (request: ActivityLogRequest) => Promise<void>;
  logPageView: (
    pagePath: string,
    pageTitle?: string,
    metadata?: Record<string, Json>
  ) => Promise<void>;
  logDashboardActivity: (
    eventType: string,
    details?: string,
    metadata?: Record<string, Json>
  ) => Promise<void>;
  logBillingActivity: (
    eventType: string,
    details: string,
    metadata?: Record<string, Json>
  ) => Promise<void>;
  logJobActivity: (
    eventType: string,
    jobId?: string,
    details?: string,
    metadata?: Record<string, Json>
  ) => Promise<void>;
}

export const useActivityLogger = (): UseActivityLoggerReturn => {
  const pageViewLogged = useRef<string | null>(null);

  // Stable — only depends on module-level imports (authService, authenticatedFetch)
  const logActivity = useCallback(async (request: ActivityLogRequest) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      await authenticatedFetch(ACTIVITY_ENDPOINTS.LOG, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (err) {
      // Activity logging is non-critical — silently swallow failures
      // (e.g. API server not running, network issues, auth expired).
      // In development, emit a debug log so developers can observe failures.
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          { error: err instanceof Error ? err : undefined, request },
          '[activity-logger] Failed to log activity (non-critical)'
        );
      }
    }
  }, []);

  const logPageView = useCallback(
    async (pagePath: string, pageTitle?: string, metadata?: Record<string, Json>) => {
      // Avoid duplicate page view logs for the same page — check both instance ref and module-level set
      const currentPage = `${pagePath}-${pageTitle || ''}`;
      if (pageViewLogged.current === currentPage) return;
      if (loggedPageViews.has(currentPage)) return;

      pageViewLogged.current = currentPage;
      loggedPageViews.add(currentPage);

      await logActivity({
        eventType: 'page_view',
        actionDescription: `Visited ${pageTitle || pagePath}`,
        targetType: 'page',
        metadata: {
          pagePath,
          pageTitle: pageTitle || null,
          pageView: true,
          ...metadata,
        },
      });
    },
    [logActivity]
  );

  const logDashboardActivity = useCallback(
    async (eventType: string, details?: string, metadata?: Record<string, Json>) => {
      await logActivity({
        eventType,
        actionDescription: details || eventType,
        targetType: 'dashboard',
        metadata: {
          dashboardActivity: true,
          ...metadata,
        },
      });
    },
    [logActivity]
  );

  const logBillingActivity = useCallback(
    async (eventType: string, details: string, metadata?: Record<string, Json>) => {
      await logActivity({
        eventType,
        actionDescription: details,
        targetType: 'billing',
        metadata: {
          billingActivity: true,
          ...metadata,
        },
      });
    },
    [logActivity]
  );

  const logJobActivity = useCallback(
    async (
      eventType: string,
      jobId?: string,
      details?: string,
      metadata?: Record<string, Json>
    ) => {
      await logActivity({
        eventType,
        actionDescription: details || eventType,
        targetType: jobId ? 'job' : undefined,
        targetId: jobId,
        metadata: {
          jobActivity: true,
          ...metadata,
        },
      });
    },
    [logActivity]
  );

  return {
    logActivity,
    logPageView,
    logDashboardActivity,
    logBillingActivity,
    logJobActivity,
  };
};

/**
 * Hook to automatically log page views when component mounts
 */
export const usePageViewLogger = (
  pagePath: string,
  pageTitle?: string,
  metadata?: Record<string, Json>
) => {
  const { logPageView } = useActivityLogger();

  useEffect(() => {
    logPageView(pagePath, pageTitle, metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePath, pageTitle, logPageView]);

  return { logPageView };
};
