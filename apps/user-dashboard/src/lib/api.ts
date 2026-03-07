'use client'

import { authService } from '@indexnow/supabase-client'

/**
 * Local API request helper — no dependency on @indexnow/database/client.
 * Authenticates via cached authService token, sends JSON, parses standardized { success, data } responses.
 */
export async function api<T = unknown>(
  url: string,
  opts?: RequestInit & { params?: Record<string, string | number | boolean> }
): Promise<T> {
  // Build URL with query params
  let fullUrl = url.startsWith('http') || url.includes('/api/v1') ? url : `/${url}`
  if (opts?.params) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined && v !== null) sp.append(k, String(v))
    }
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + sp.toString()
  }

  // Auth — uses cached token (avoids redundant getUser() network calls per request)
  const token = await authService.getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(fullUrl, {
    credentials: 'include',
    ...opts,
    headers,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      (typeof json?.error === 'string' ? json.error : `HTTP ${res.status}`)
    throw new Error(msg)
  }

  // Standardized format: { success: true, data: T }
  if ('success' in json && json.success && json.data !== undefined) {
    return json.data as T
  }

  return json as T
}
