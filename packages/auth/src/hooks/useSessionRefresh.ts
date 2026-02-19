'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@indexnow/supabase-client';
import { logger } from '@indexnow/shared';

/**
 * Configuration for session refresh behavior
 */
interface UseSessionRefreshOptions {
  /** How many minutes before expiry to proactively refresh (default: 5) */
  refreshBeforeExpiryMinutes?: number;
  /** How often to check session expiry in ms (default: 60000 = 1 minute) */
  checkIntervalMs?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook that proactively refreshes the Supabase session before token expiry.
 *
 * Solves issue #106: When a user's session token expires, the app previously
 * didn't proactively refresh it, causing silent 401 errors.
 *
 * This hook:
 * - Periodically checks the current session's expiry time
 * - Calls `supabase.auth.refreshSession()` when within the refresh window
 * - Handles TOKEN_REFRESHED events to reset the timer
 * - Gracefully handles errors without disrupting the user experience
 *
 * @example
 * ```tsx
 * function App() {
 *   useSessionRefresh() // Uses defaults: refresh 5 min before expiry, check every 1 min
 *   return <div>...</div>
 * }
 * ```
 */
export function useSessionRefresh(options: UseSessionRefreshOptions = {}) {
  const {
    refreshBeforeExpiryMinutes = 5,
    checkIntervalMs = 60_000, // 1 minute
    enabled = true,
  } = options;

  const isRefreshing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRefreshAttempt = useRef<number>(0);

  // Minimum 30 seconds between refresh attempts to avoid hammering
  const MIN_REFRESH_INTERVAL_MS = 30_000;

  const checkAndRefreshSession = useCallback(async () => {
    if (isRefreshing.current) return;
    if (typeof window === 'undefined') return;

    const now = Date.now();
    if (now - lastRefreshAttempt.current < MIN_REFRESH_INTERVAL_MS) return;

    try {
      // (#V7 L-07) getSession() is used intentionally instead of getUser().
      // This hook only needs the expiry timestamp to decide whether to refresh;
      // getUser() makes a network call to validate the JWT, which would defeat
      // the purpose of a lightweight refresh-check timer.
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        // No session or error getting session — nothing to refresh
        return;
      }

      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const expiresAtMs = expiresAt * 1000; // Convert Unix timestamp to ms
      const refreshWindowMs = refreshBeforeExpiryMinutes * 60 * 1000;
      const timeUntilExpiry = expiresAtMs - now;

      if (timeUntilExpiry <= refreshWindowMs && timeUntilExpiry > 0) {
        // Token is within the refresh window — proactively refresh
        isRefreshing.current = true;
        lastRefreshAttempt.current = now;

        logger.info(
          `Session expires in ${Math.round(timeUntilExpiry / 1000)}s — proactively refreshing`
        );

        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          logger.warn(
            { error: refreshError },
            'Proactive session refresh failed — Supabase will retry automatically'
          );
        } else {
          logger.info('Session proactively refreshed successfully');
        }

        isRefreshing.current = false;
      }
    } catch (error) {
      isRefreshing.current = false;
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Error checking session expiry'
      );
    }
  }, [refreshBeforeExpiryMinutes]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initial check after a short delay (let the app finish mounting)
    const initialTimeout = setTimeout(() => {
      checkAndRefreshSession();
    }, 5_000);

    // Periodic check
    timerRef.current = setInterval(checkAndRefreshSession, checkIntervalMs);

    // Also refresh when the window regains focus (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkIntervalMs, checkAndRefreshSession]);
}
