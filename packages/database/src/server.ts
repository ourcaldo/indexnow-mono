import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database, AppConfig } from '@indexnow/shared'

interface CookieStore {
    getAll: () => { name: string; value: string }[]
    set: (name: string, value: string, options?: CookieOptions) => void
}

/**
 * Creates a Supabase client for use in Server Components and Server Actions
 * Uses cookies for auth state
 * 
 * @param cookieStore - The cookie store from `cookies()` call in Next.js
 */
export function createClient(cookieStore: CookieStore): SupabaseClient<Database, 'public'> {
    return createSupabaseServerClient<Database>(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    )
}

/**
 * Creates a Supabase admin client with service role key
 * Use this for operations that bypass RLS (admin operations only)
 */
export function createAdminClient(): SupabaseClient<Database, 'public'> {
    const supabaseUrl = AppConfig.supabase.url
    const serviceRoleKey = AppConfig.supabase.serviceRoleKey

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase URL or Service Role Key in configuration')
    }

    return createSupabaseClient<Database, 'public'>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    })
}

/**
 * Singleton Supabase admin client for server-side operations
 */
export const supabaseAdmin: SupabaseClient<Database, 'public'> = createAdminClient()

export type { CookieStore }
