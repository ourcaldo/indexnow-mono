import { getUser } from '@indexnow/auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@indexnow/shared';

/**
 * Admin Application Middleware
 * Handles authentication and super_admin role verification.
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
  // crypto.subtle.verify performs timing-safe comparison internally
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(value));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // (#V7 L-27) 1. Skip middleware for public routes.
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Get user session using the centralized database helper
  const { user, response, supabase } = await getUser(request, NextResponse);

  // 2. If not logged in, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Check HMAC-signed cached role verification (avoids DB query on every request).
  // Caching is only active when ENCRYPTION_KEY is set; otherwise every request hits DB.
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
            return response;
          }
        } catch {
          // Verification failed — fall through to DB query
        }
      }
    }
  }

  // 4. Verify admin role via database query (only when cache misses or is invalid)
  try {
    const { data: profile, error: profileError } = (await supabase
      .from('indb_auth_user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()) as { data: { role: string } | null; error: { message: string } | null };

    if (profileError || !profile) {
      logger.warn(
        {
          userId: user.id,
          error: profileError?.message,
        },
        'Admin middleware: Failed to fetch user profile'
      );
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const isSuperAdmin = profile.role === 'super_admin';

    if (!isSuperAdmin) {
      logger.warn(
        {
          userId: user.id,
          role: profile.role,
        },
        'Admin middleware: Unauthorized role'
      );
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Cache the verified role as an HMAC-signed, httpOnly cookie.
    if (cookieSecret) {
      const signedValue = `${user.id}.${await hmacSign(user.id, cookieSecret)}`;
      response.cookies.set(ROLE_CACHE_COOKIE, signedValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ROLE_CACHE_TTL_SECONDS,
        path: '/',
      });
    }
  } catch (error: unknown) {
    logger.error(
      { error: error instanceof Error ? error : undefined },
      'Admin middleware verification error'
    );
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
