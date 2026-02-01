import { getUser } from '@indexnow/database'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin Application Middleware
 * Handles authentication and super_admin role verification
 */

const PUBLIC_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Get user session using the centralized database helper
  const { user, response, supabase } = await getUser(request, NextResponse)

  // 2. If not logged in, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Verify admin role
  const { data: profile } = await supabase
    .from('indb_auth_user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    // Redirect to login if not a super_admin
    const loginUrl = new URL('/login', request.url)
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
