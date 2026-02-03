import { getUser } from '@indexnow/auth'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_ENDPOINTS, type ApiResponse, logger } from '@indexnow/shared'

/**
 * Admin Application Middleware
 * Handles authentication and super_admin role verification
 */

const PUBLIC_ROUTES = ['/login']

interface VerifyRoleResponse {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: string
  name: string
}

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

  // 3. Verify admin role via API (Centralized logic)
  try {
    // Call the centralized verify-role endpoint
    const verifyUrl = new URL(ADMIN_ENDPOINTS.VERIFY_ROLE)
    
    const authResponse = await fetch(verifyUrl.toString(), {
      headers: {
        // Forward cookies for authentication
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (!authResponse.ok) {
      logger.warn({ 
        userId: user.id, 
        status: authResponse.status 
      }, 'Admin middleware: API verification failed')
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const result = (await authResponse.json()) as ApiResponse<VerifyRoleResponse>
    
    if (!result.success || !result.data || !result.data.isSuperAdmin) {
      logger.warn({ 
        userId: user.id, 
        role: result.data?.role 
      }, 'Admin middleware: Unauthorized role')
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    logger.error({ error }, 'Admin middleware verification error')
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
