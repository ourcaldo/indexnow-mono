import 'server-only';
import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database, AppConfig } from '@indexnow/shared';

/**
 * CookieStore interface for SSR
 */
export interface CookieStore {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: CookieOptions) => void;
}

// Middleware utilities are extracted to middleware-utils.ts (Edge-compatible, no 'server-only')
// Re-exported here for backward compatibility
export {
  createMiddlewareClient,
  type MiddlewareRequest,
  type MiddlewareResponse,
  type MiddlewareResponseFactory,
} from './middleware-utils';

/**
 * Internal interface for cookie options during setAll
 */
interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
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
  const supabaseUrl = AppConfig.supabase.url;
  const supabaseAnonKey = AppConfig.supabase.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key in configuration');
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(
              name,
              value,
              cookieDefaults ? { ...options, ...cookieDefaults } : options
            )
          );
        } catch {
          /* Server Component cookie set — handled by middleware */
        }
      },
    },
  });
}

/**
 * Creates a user-authenticated Supabase client from a bearer token.
 * Used by API middleware for authenticated requests without cookie handling.
 *
 * @param token - The bearer token from the Authorization header
 */
export function createTokenClient(
  token: string
): ReturnType<typeof createSupabaseServerClient<Database>> {
  const supabaseUrl = AppConfig.supabase.url;
  const supabaseAnonKey = AppConfig.supabase.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key in configuration');
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

/**
 * Creates a headless Supabase server client without cookie or auth handling.
 * Used for server operations that don't require session management (e.g. login, resend-verification).
 */
export function createAnonServerClient(): ReturnType<typeof createSupabaseServerClient<Database>> {
  const supabaseUrl = AppConfig.supabase.url;
  const supabaseAnonKey = AppConfig.supabase.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key in configuration');
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

/**
 * Creates a Supabase admin client with the service role key.
 * Use this for operations that bypass Row Level Security (admin operations only).
 *
 * @warning Never expose the service role key to the client.
 */
export function createAdminClient(): ReturnType<typeof createSupabaseClient<Database>> {
  const supabaseUrl = AppConfig.supabase.url;
  const serviceRoleKey = AppConfig.supabase.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key in configuration');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Singleton Supabase admin client for server-side operations.
 */
export const supabaseAdmin = createAdminClient();

/**
 * Request-like object with headers for auth client creation.
 */
export interface AuthRequest {
  headers: {
    get(name: string): string | null;
  };
  method?: string;
}

/**
 * Options for createRequestAuthClient.
 */
export interface RequestAuthClientOptions {
  /** When true, cookies are ignored — only bearer token (via getUser(token)) works */
  forceHeaderAuth?: boolean;
}

/**
 * Parses a raw `cookie` header string into the `{ name, value }[]` format
 * expected by `@supabase/ssr`'s `getAll` method.
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [key, ...rest] = cookie.trim().split('=');
    const value = rest.join('=');
    try {
      return { name: key, value: decodeURIComponent(value || '') };
    } catch {
      /* Invalid URI encoding fallback */
      return { name: key, value: value || '' };
    }
  });
}

/**
 * Creates a Supabase server client from a raw HTTP request (e.g. NextRequest).
 *
 * Reads cookies from the `cookie` header. For state-changing methods (POST/PUT/PATCH/DELETE)
 * or when `forceHeaderAuth` is true, cookies are ignored — the caller should use
 * bearer-token auth via `supabase.auth.getUser(token)` instead.
 *
 * This is read-only (no set/remove) — suitable for API route auth checks.
 */
export function createRequestAuthClient(
  request: AuthRequest,
  options: RequestAuthClientOptions = {}
): ReturnType<typeof createSupabaseServerClient<Database>> {
  const supabaseUrl = AppConfig.supabase.url;
  const supabaseAnonKey = AppConfig.supabase.anonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key in configuration');
  }

  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method ?? '');
  const skipCookies = options.forceHeaderAuth || isStateChanging;

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (skipCookies) return [];
        const cookieHeader = request.headers.get('cookie');
        if (!cookieHeader) return [];
        return parseCookieHeader(cookieHeader);
      },
      setAll() {
        // Read-only — session refresh handled by middleware
      },
    },
  });
}
