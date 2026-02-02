import { getUser } from '@indexnow/auth'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_ENDPOINTS, type ApiResponse } from '@indexnow/shared'

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

  // 3. Verify admin role via API (API is the backbone)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      throw new Error('No session token found')
    }

    const verifyResponse = await fetch(ADMIN_ENDPOINTS.VERIFY_ROLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id }),
      credentials: 'include'
    })

    if (!verifyResponse.ok) {
      throw new Error('Role verification failed')
    }

    const result = await verifyResponse.json() as ApiResponse<VerifyRoleResponse>
    
    if (!result.success || !result.data || result.data.role !== 'super_admin') {
      // Redirect to login if not a super_admin
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error('Admin middleware verification error:', error)
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
