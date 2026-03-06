'use client';

/**
 * Admin Activity Logger — client-side page-view & observation tracking.
 *
 * Mutations (suspend, update order, etc.) are already logged server-side via
 * ActivityLogger.logAdminAction() — we intentionally do NOT duplicate those here.
 *
 * This hook covers what the server cannot see:
 *   - Which admin pages were viewed (browsing pattern)
 *   - Dashboard stats refreshes
 *
 * All calls go through the standard POST /api/v1/activity endpoint, which is
 * authenticated (works for any logged-in user, including admins).
 */

import { useEffect, useRef, useCallback } from 'react';
import { type Json, ACTIVITY_ENDPOINTS, logger } from '@indexnow/shared';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';

// Module-level dedup: prevents duplicate page views across multiple hook instances
const loggedAdminPageViews = new Set<string>();

interface ActivityLogRequest {
  eventType: string;
  actionDescription: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, Json>;
}

/**
 * Core hook — thin wrapper around POST /api/v1/activity with admin context.
 */
export function useAdminActivityLogger() {
  const logActivity = useCallback(async (request: ActivityLogRequest) => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      await authenticatedFetch(ACTIVITY_ENDPOINTS.LOG, {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          metadata: {
            adminAction: true,
            ...request.metadata,
          },
        }),
      });
    } catch (err) {
      // Activity logging is non-critical — silently swallow failures
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          { error: err instanceof Error ? err : undefined },
          '[admin-activity-logger] Failed to log (non-critical)'
        );
      }
    }
  }, []);

  return { logActivity };
}

/**
 * Auto-fires a single admin_page_view event when the component mounts.
 * Deduplicates by `section + pageName` at both instance and module level.
 */
export function useAdminPageViewLogger(
  section: string,
  pageName: string,
  metadata?: Record<string, Json>
) {
  const { logActivity } = useAdminActivityLogger();
  const hasLogged = useRef(false);

  useEffect(() => {
    const key = `admin:${section}:${pageName}`;
    if (hasLogged.current || loggedAdminPageViews.has(key)) return;

    hasLogged.current = true;
    loggedAdminPageViews.add(key);

    logActivity({
      eventType: 'admin_page_view',
      actionDescription: `Admin viewed ${pageName}`,
      targetType: 'admin_page',
      metadata: {
        section,
        pageName,
        ...metadata,
      },
    }).catch(() => {
      // Reset on failure so next mount retries
      hasLogged.current = false;
      loggedAdminPageViews.delete(key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logActivity, section, pageName]);
}

/**
 * Dashboard-specific logger for stats refresh (an observable read action).
 */
export function useAdminDashboardLogger() {
  const { logActivity } = useAdminActivityLogger();

  const logStatsRefresh = useCallback(() => {
    logActivity({
      eventType: 'admin_stats_refresh',
      actionDescription: 'Admin refreshed dashboard statistics',
      targetType: 'admin_page',
      metadata: { section: 'dashboard' },
    });
  }, [logActivity]);

  return { logStatsRefresh };
}
