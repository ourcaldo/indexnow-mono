import 'server-only'
import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database, AppConfig } from '@indexnow/shared'

/**
 * CookieStore interface for SSR
 */
export interface CookieStore {
    getAll: () => { name: string; value: string }[]
    set: (name: string, value: string, options?: CookieOptions) => void
}

/**
 * Generic request type that works with Next.js and other frameworks
 */
export interface MiddlewareRequest {
    cookies: {
        getAll: () => { name: string; value: string }[]
        set: (name: string, value: string) => void
    }
    headers: Headers
}

/**
 * Generic response type that works with Next.js and other frameworks
 */
export interface MiddlewareResponse {
    cookies: {
        set: (name: string, value: string, options?: CookieOptions) => void
    }
}

/**
 * Factory interface for creating responses in middleware
 */
export interface MiddlewareResponseFactory {
    next: (options?: { request?: { headers: Headers } }) => MiddlewareResponse
}

/**
 * Internal interface for cookie options during setAll
 */
interface CookieToSet {
    name: string
    value: string
    options?: CookieOptions
}

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * Uses cookies for authentication state management.
 * 
 * @param cookieStore - The cookie store from `cookies()` call in Next.js
 * @param cookieDefaults - Optional extra cookie options merged into every set call (e.g. cross-subdomain domain, maxAge)
 */
export function createServerClient(
    cookieStore: CookieStore,
    cookieDefaults?: CookieOptions
): ReturnType<typeof createSupabaseServerClient<Database>> {
    const supabaseUrl = AppConfig.supabase.url
    const supabaseAnonKey = AppConfig.supabase.anonKey

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase URL or Anon Key in configuration')
    }

    return createSupabaseServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, cookieDefaults ? { ...options, ...cookieDefaults } : options)
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
 * Creates a user-authenticated Supabase client from a bearer token.
 * Used by API middleware for authenticated requests without cookie handling.
 * 
 * @param token - The bearer token from the Authorization header
 */
export function createTokenClient(token: string): ReturnType<typeof createSupabaseServerClient<Database>> {
    const supabaseUrl = AppConfig.supabase.url
    const supabaseAnonKey = AppConfig.supabase.anonKey

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase URL or Anon Key in configuration')
    }

    return createSupabaseServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            },
            cookies: {
                getAll() { return [] },
                setAll() {},
            },
        }
    )
}

/**
 * Creates a headless Supabase server client without cookie or auth handling.
 * Used for server operations that don't require session management (e.g. login, resend-verification).
 */
export function createAnonServerClient(): ReturnType<typeof createSupabaseServerClient<Database>> {
    const supabaseUrl = AppConfig.supabase.url
    const supabaseAnonKey = AppConfig.supabase.anonKey

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase URL or Anon Key in configuration')
    }

    return createSupabaseServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() { return [] },
                setAll() {},
            },
        }
    )
}

/**
 * Creates a Supabase admin client with the service role key.
 * Use this for operations that bypass Row Level Security (admin operations only).
 * 
 * @warning Never expose the service role key to the client.
 */
export function createAdminClient(): ReturnType<typeof createSupabaseClient<Database>> {
    const supabaseUrl = AppConfig.supabase.url
    const serviceRoleKey = AppConfig.supabase.serviceRoleKey

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase URL or Service Role Key in configuration')
    }

    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
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
 * Singleton Supabase admin client for server-side operations.
 */
export const supabaseAdmin = createAdminClient()

/**
 * Creates a Supabase client for use in middleware
 * Handles cookie refresh for auth sessions
 * 
 * @param request - The middleware request object
 * @param ResponseFactory - The response factory (e.g. NextResponse)
 */
export function createMiddlewareClient<TRequest extends MiddlewareRequest>(
    request: TRequest,
    ResponseFactory: MiddlewareResponseFactory
) {
    let response = ResponseFactory.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createSupabaseServerClient<Database>(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: CookieToSet[]) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = ResponseFactory.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    return { supabase, response }
}
