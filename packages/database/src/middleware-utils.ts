/**
 * Middleware utilities for Supabase auth in Edge Runtime.
 * These are extracted from server.ts because Edge middleware cannot use
 * the 'server-only' module that server.ts imports.
 */
import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { Database, AppConfig } from '@indexnow/shared'

export interface MiddlewareRequest {
    cookies: {
        getAll: () => { name: string; value: string }[]
        set: (name: string, value: string) => void
    }
    headers: Headers
}

export interface MiddlewareResponse {
    cookies: {
        set: (name: string, value: string, options?: CookieOptions) => void
    }
}

export interface MiddlewareResponseFactory {
    next: (options?: { request?: { headers: Headers } }) => MiddlewareResponse
}

interface CookieToSet {
    name: string
    value: string
    options?: CookieOptions
}

/**
 * Creates a Supabase client specifically for middleware use.
 * Edge-compatible — no 'server-only' import.
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
