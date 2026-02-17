'use client'

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { type Database } from '@indexnow/shared'
import { AppConfig } from '@indexnow/shared'

let isHandlingRefreshError = false

/**
 * Performs a hard logout, clearing all Supabase-related data from storage and cookies.
 */
async function hardLogout(client: ReturnType<typeof createSupabaseBrowserClient<Database>>) {
    if (isHandlingRefreshError) return

    isHandlingRefreshError = true

    try {
        try {
            await client.auth.signOut()
        } catch (err) {
            // Continue even if signOut fails
        }

        if (typeof window !== 'undefined') {
            try {
                const keysToRemove: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
                        keysToRemove.push(key)
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key))
            } catch (err) {
                // Ignore errors
            }

            try {
                sessionStorage.clear()
            } catch (err) {
                // Ignore errors
            }

            try {
                const cookies = document.cookie.split(';')
                for (const cookie of cookies) {
                    const name = cookie.split('=')[0].trim()
                    if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) {
                        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`

                        const hostname = window.location.hostname
                        const domains = [
                            hostname,
                            `.${hostname}`,
                            hostname.split('.').slice(-2).join('.'),
                            `.${hostname.split('.').slice(-2).join('.')}`
                        ]

                        domains.forEach(domain => {
                            document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
                        })
                    }
                }
            } catch (err) {
                // Ignore errors
            }

            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login'
            }
        }
    } finally {
        setTimeout(() => {
            isHandlingRefreshError = false
        }, 1000)
    }
}

/**
 * Creates a Supabase client for use in the browser (client components)
 * 
 * Auth state handling architecture (2 layers, no more triple-redundancy):
 * 
 * Layer 1 (this file): Last-resort safety net at the Supabase client singleton level.
 *   - Fires hardLogout on SIGNED_OUT or refresh_token_already_used errors.
 *   - Operates independently of React — handles edge cases where React tree
 *     isn't mounted (e.g., during SSR hydration or before AuthProvider initializes).
 * 
 * Layer 2 (AuthProvider in @indexnow/auth): Primary auth state management.
 *   - Uses AuthErrorHandler.createAuthStateChangeHandler() for auth events.
 *   - Manages React state (user, loading, authChecked, isAuthenticated).
 *   - useSessionRefresh() proactively refreshes tokens before expiry (#106).
 *   - Handles redirect to /login on unrecoverable sign-out.
 * 
 * Previously, there was also a Layer 3 (admin login page's own listener) which
 * was removed to eliminate triple-redundancy. Per-page auth listeners should not
 * be added — use AuthProvider centrally instead.
 */
export function createBrowserClient() {
    const supabaseUrl = AppConfig.supabase.url
    const supabaseKey = AppConfig.supabase.anonKey

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase URL or Anon Key in configuration')
    }

    const client = createSupabaseBrowserClient<Database>(supabaseUrl, supabaseKey)

    if (typeof window !== 'undefined') {
        client.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                await hardLogout(client)
                return
            }

            if (!session) {
                try {
                    const { error } = await client.auth.getSession()
                    if (error?.message?.toLowerCase().includes('already used') ||
                        (error && 'code' in error && error.code === 'refresh_token_already_used')) {
                        await hardLogout(client)
                        return
                    }
                } catch (err) {
                    if (err && typeof err === 'object') {
                      const error = err as { message?: string; code?: string }
                      if (error.message?.toLowerCase().includes('already used') ||
                          error.code === 'refresh_token_already_used') {
                          await hardLogout(client)
                          return
                      }
                    }
                }
            }
        })
    }

    return client
}

// Singleton instance for convenience
let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Get a singleton browser client instance
 */
export function getBrowserClient() {
    if (!browserClient) {
        browserClient = createBrowserClient()
    }
    return browserClient
}

/**
 * Singleton Supabase client for browser use
 */
export const supabaseBrowser = getBrowserClient()
export const supabase = supabaseBrowser
