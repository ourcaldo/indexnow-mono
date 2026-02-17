import { getUser } from '@indexnow/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * User Dashboard Middleware
 * Uses denylist approach: all routes are protected by default,
 * only explicitly listed public routes are accessible without auth.
 */

/** Routes accessible without authentication */
const PUBLIC_ROUTES = ['/login', '/register', '/auth', '/resend-verification', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Get user session using the centralized database helper
  const { user, response } = await getUser(request, NextResponse)

  // 1. If user is authenticated and tries to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. If user is NOT authenticated and tries to access any non-public route, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
