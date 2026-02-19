import { authService } from './auth-service';
import { supabase } from './supabase-browser';
import { logger } from '@indexnow/shared';

/**
 * Options for authenticatedFetch
 */
export interface AuthenticatedFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Skip automatic token injection (for public endpoints) */
  skipAuth?: boolean;
  /** Retry on 401 after refreshing the session (default: true) */
  retryOn401?: boolean;
}

/**
 * Authenticated fetch wrapper that automatically injects the Authorization header.
 *
 * Solves issues #107 and #137: Replaces 3+ inconsistent patterns for authenticated
 * API calls with a single unified approach:
 *
 * Before (Pattern A): authService.getToken() → manual header
 * Before (Pattern B): supabaseBrowser.auth.getSession() → manual header
 * Before (Pattern C): credentials: 'include' only (no token)
 *
 * After: authenticatedFetch(url, options) → token injected automatically
 *
 * Features:
 * - Automatically gets token via authService.getToken()
 * - Injects Authorization: Bearer <token> header
 * - Always includes credentials: 'include' for cookie-based fallback
 * - On 401, refreshes session and retries once
 * - Returns the raw Response (compatible with existing code patterns)
 *
 * @example
 * ```ts
 * // Simple GET
 * const response = await authenticatedFetch('/api/v1/profile')
 * const data = await response.json()
 *
 * // POST with body
 * const response = await authenticatedFetch('/api/v1/settings', {
 *   method: 'POST',
 *   body: JSON.stringify({ theme: 'dark' }),
 * })
 *
 * // With custom headers
 * const response = await authenticatedFetch('/api/v1/upload', {
 *   method: 'POST',
 *   headers: { 'X-Custom': 'value' },
 *   body: formData,
 * })
 * ```
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const {
    skipAuth = false,
    retryOn401 = true,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const headers: Record<string, string> = {
    ...customHeaders,
  };

  // Add Content-Type if not explicitly set and not FormData
  if (!headers['Content-Type'] && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject auth token
  if (!skipAuth) {
    try {
      const token = await authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      logger.warn('Failed to get auth token for fetch — proceeding without token');
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  // (#V7 M-10) On 401, try refreshing the session and retry once.
  // Note: `headers` object is mutated with the new token — this is safe because
  // the headers object was cloned at the top of this function.
  if (response.status === 401 && retryOn401 && !skipAuth) {
    try {
      logger.info('Got 401 — attempting session refresh and retry');
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (!refreshError) {
        // Get the new token after refresh
        const newToken = await authService.getToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
        }

        // Retry the request with the new token
        return fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });
      }
    } catch (retryError) {
      logger.warn('Session refresh on 401 failed — returning original 401 response');
    }
  }

  return response;
}

/**
 * Typed wrapper around authenticatedFetch that parses JSON response.
 *
 * @example
 * ```ts
 * const { data, error } = await authenticatedFetchJson<UserProfile>('/api/v1/profile')
 * ```
 */
export async function authenticatedFetchJson<T = unknown>(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const response = await authenticatedFetch(url, options);
    const status = response.status;

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorBody = (await response.json()) as { error?: string; message?: string };
        errorMessage =
          errorBody.error || errorBody.message || `Request failed with status ${status}`;
      } catch {
        /* Response body parse fallback */
        errorMessage = `Request failed with status ${status}`;
      }
      return { data: null, error: errorMessage, status };
    }

    const data = (await response.json()) as T;
    return { data, error: null, status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    };
  }
}
