import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database, AppConfig } from '@indexnow/shared'

// Generic request type that works with Next.js and other frameworks
interface MiddlewareRequest {
    cookies: {
        getAll: () => { name: string; value: string }[]
        set: (name: string, value: string) => void
    }
    headers: Headers
}

interface MiddlewareResponse {
    cookies: {
        set: (name: string, value: string, options?: CookieOptions) => void
    }
}

interface MiddlewareResponseFactory {
    next: (options?: { request?: { headers: Headers } }) => MiddlewareResponse
}

interface CookieToSet {
    name: string
    value: string
    options?: CookieOptions
}

/**
 * Creates a Supabase client for use in Next.js middleware
 * Handles cookie refresh for auth sessions
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

    const supabase = createServerClient<Database>(
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

/**
 * Helper to get user from middleware client
 */
export async function getUser<TRequest extends MiddlewareRequest>(
    request: TRequest,
    ResponseFactory: MiddlewareResponseFactory
) {
    const { supabase, response } = createMiddlewareClient(request, ResponseFactory)
    const { data: { user }, error } = await supabase.auth.getUser()

    return { user, error, response, supabase }
}

export type { MiddlewareRequest, MiddlewareResponse, MiddlewareResponseFactory }
