'use client'

import { authService } from '@indexnow/supabase-client'
import { type ZodType } from 'zod'

/**
 * Local API request helper — no dependency on @indexnow/database/client.
 * Authenticates via cached authService token, sends JSON, parses standardized { success, data } responses.
 * Optionally validates the response against a Zod schema (logs warning on mismatch, never throws).
 */
export async function api<T = unknown>(
  url: string,
  opts?: RequestInit & {
    params?: Record<string, string | number | boolean>
    schema?: ZodType
  }
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
  let data: T
  if ('success' in json && json.success && json.data !== undefined) {
    data = json.data as T
  } else {
    data = json as T
  }

  // Runtime validation (non-breaking — logs warning only)
  if (opts?.schema) {
    const result = opts.schema.safeParse(data)
    if (!result.success) {
      console.warn(
        `[API Response Validation] Schema mismatch for ${url}:`,
        result.error.issues.map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`),
      )
    }
  }

  return data
}
