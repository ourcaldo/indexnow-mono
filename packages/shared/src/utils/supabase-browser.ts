'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database'

let isHandlingRefreshError = false

async function hardLogout(client: ReturnType<typeof createBrowserClient>) {
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
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    const client = createBrowserClient<Database>(supabaseUrl, supabaseKey)

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
let browserClient: ReturnType<typeof createClient> | null = null

/**
 * Get a singleton browser client instance
 */
export function getBrowserClient() {
    if (!browserClient) {
        browserClient = createClient()
    }
    return browserClient
}

/**
 * Singleton Supabase client for browser use
 */
export const supabase = getBrowserClient()
