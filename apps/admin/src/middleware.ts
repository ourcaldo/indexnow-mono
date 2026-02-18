import { getUser } from '@indexnow/auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@indexnow/shared';

/**
 * Admin Application Middleware
 * Handles authentication and super_admin role verification.
 *
 * OPTIMIZATION: Caches admin role verification in a short-lived cookie (5 min)
 * to avoid a DB query on every single request. The cookie is tied to the user's
 * session and cleared on auth state changes.
 */

const PUBLIC_ROUTES = ['/login'];
const ROLE_CACHE_COOKIE = 'admin_role_verified';
const ROLE_CACHE_TTL_SECONDS = 60; // 1 minute — short TTL balances performance vs. security

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Skip middleware for public routes
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

  // 3. Check cached role verification first (avoids DB query on every request)
  const cachedRole = request.cookies.get(ROLE_CACHE_COOKIE)?.value;
  if (cachedRole === user.id) {
    // Role was recently verified for this user — skip DB query
    return response;
  }

  // 4. Verify admin role via database query (only when cache misses)
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

    // Cache the role verification result in a short-lived, httpOnly cookie
    response.cookies.set(ROLE_CACHE_COOKIE, user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ROLE_CACHE_TTL_SECONDS,
      path: '/',
    });
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
