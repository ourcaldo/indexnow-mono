import { getUser } from '@indexnow/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * User Dashboard Middleware
 * Handles authentication for the user dashboard application
 */

const PROTECTED_ROUTES = ['/dashboard', '/settings']
const AUTH_ROUTES = ['/login', '/register', '/auth', '/resend-verification']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Get user session using the centralized database helper
  const { user, response } = await getUser(request, NextResponse)

  // 1. If user is authenticated and tries to access auth pages, redirect to dashboard
  if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. If user is NOT authenticated and tries to access protected routes, redirect to login
  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
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
