import { getUser } from '@indexnow/auth';
import type { MiddlewareResponse } from '@indexnow/database';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@indexnow/shared';

/**
 * Admin Application Middleware
 * Handles authentication, super_admin role verification, and nonce-based CSP.
 *
 * CSP: Generates a unique cryptographic nonce per request for script-src.
 * This eliminates 'unsafe-inline' and 'unsafe-eval' (C-04/C-05 fix).
 *
 * OPTIMIZATION: Caches admin role verification in a short-lived HMAC-signed
 * cookie (1 min) to avoid a DB query on every request. The cookie value is
 * `userId.hmacHex` — forging it requires knowledge of ENCRYPTION_KEY.
 * If the key is missing, caching is disabled and the DB is queried every time.
 */

const PUBLIC_ROUTES = ['/login'];
const ROLE_CACHE_COOKIE = 'admin_role_verified';
const ROLE_CACHE_TTL_SECONDS = 60;

// ---------------------------------------------------------------------------
// CSP nonce helpers — generates per-request nonce for script-src
// ---------------------------------------------------------------------------

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCspHeader(nonce: string): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const connectParts = [
    "'self'",
    'https://*.supabase.co',
    'https://*.sentry.io',
    'https://*.posthog.com',
  ];
  if (apiBaseUrl) {
    try {
      connectParts.push(new URL(apiBaseUrl).origin);
    } catch { /* malformed URL — skip */ }
  }
  const connectSrc = connectParts.join(' ');

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ') + ';';
}

/**
 * Build a NextResponse with CSP header and nonce forwarded via request headers.
 * Copies cookies from an optional auth response to preserve Supabase session.
 */
function createCspResponse(
  request: NextRequest,
  nonce: string,
  authResponse?: MiddlewareResponse,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (authResponse) {
    for (const { name, value, ...options } of authResponse.cookies.getAll()) {
      response.cookies.set(name, value, options);
    }
  }

  response.headers.set('Content-Security-Policy', buildCspHeader(nonce));
  return response;
}

// ---------------------------------------------------------------------------
// HMAC helpers — Web Crypto API for Edge Runtime compatibility
// ---------------------------------------------------------------------------

async function hmacSign(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacVerify(value: string, hexSignature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigMatch = hexSignature.match(/.{2}/g);
  if (!sigMatch) return false;
  const sigBytes = new Uint8Array(sigMatch.map((byte) => parseInt(byte, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(value));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const pathname = request.nextUrl.pathname;

  // (#V7 L-27) 1. Skip auth for public routes — still serve with CSP.
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return createCspResponse(request, nonce);
  }

  // Get user session using the centralized database helper
  const { user, response: authResponse, supabase } = await getUser(request, NextResponse);

  // 2. If not logged in, redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Check HMAC-signed cached role verification (avoids DB query on every request).
  const cookieSecret = process.env.ENCRYPTION_KEY;
  if (cookieSecret) {
    const cached = request.cookies.get(ROLE_CACHE_COOKIE)?.value;
    if (cached) {
      const dotIdx = cached.lastIndexOf('.');
      if (dotIdx > 0) {
        const cachedUserId = cached.substring(0, dotIdx);
        const cachedSig = cached.substring(dotIdx + 1);
        try {
          if (
            cachedUserId === user.id &&
            (await hmacVerify(cachedUserId, cachedSig, cookieSecret))
          ) {
            return createCspResponse(request, nonce, authResponse);
          }
        } catch {
          // Verification failed — fall through to DB query
        }
      }
    }
  }

  // 4. Verify admin role via database query (only when cache misses or is invalid)
  // NOTE: This direct DB query is intentional and acceptable for Edge middleware.
  // Middleware runs before route handlers, so it cannot proxy through the API.
  // The query uses the user's RLS-scoped Supabase client (not service-role),
  // ensuring only the authenticated user's own profile is accessible.
  try {
    const { data: profile, error: profileError } = (await supabase
      .from('indb_auth_user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()) as { data: { role: string } | null; error: { message: string } | null };

    if (profileError || !profile) {
      logger.warn(
        { userId: user.id, error: profileError?.message },
        'Admin middleware: Failed to fetch user profile'
      );
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (profile.role !== 'super_admin') {
      logger.warn(
        { userId: user.id, role: profile.role },
        'Admin middleware: Unauthorized role'
      );
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Cache the verified role + return response with CSP nonce
    const finalResponse = createCspResponse(request, nonce, authResponse);
    if (cookieSecret) {
      const signedValue = `${user.id}.${await hmacSign(user.id, cookieSecret)}`;
      finalResponse.cookies.set(ROLE_CACHE_COOKIE, signedValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ROLE_CACHE_TTL_SECONDS,
        path: '/',
      });
    }
    return finalResponse;
  } catch (error: unknown) {
    logger.error(
      { error: error instanceof Error ? error : undefined },
      'Admin middleware verification error'
    );
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
