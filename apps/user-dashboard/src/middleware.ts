import { getUser } from '@indexnow/auth'
import type { MiddlewareResponse } from '@indexnow/database'
import { NextRequest, NextResponse } from 'next/server'

/**
 * User Dashboard Middleware
 * Uses denylist approach: all routes are protected by default,
 * only explicitly listed public routes are accessible without auth.
 *
 * CSP: Generates a unique cryptographic nonce per request for script-src.
 * This eliminates 'unsafe-inline' and 'unsafe-eval' (C-04/C-05 fix).
 */

/** Routes accessible without authentication */
const PUBLIC_ROUTES = ['/login', '/register', '/auth', '/resend-verification', '/forgot-password', '/reset-password']

// ---------------------------------------------------------------------------
// CSP nonce helpers — generates per-request nonce for script-src
// ---------------------------------------------------------------------------

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

function buildCspHeader(nonce: string): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const connectParts = [
    "'self'",
    'https://*.supabase.co',
    'https://*.paddle.com',
    'https://*.google-analytics.com',
    'https://*.posthog.com',
    'https://*.sentry.io',
  ]
  if (apiBaseUrl) {
    try {
      connectParts.push(new URL(apiBaseUrl).origin)
    } catch { /* malformed URL — skip */ }
  }
  const connectSrc = connectParts.join(' ')

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdn.paddle.com https://*.googletagmanager.com https://*.posthog.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://*.paddle.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ') + ';'
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
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  if (authResponse) {
    for (const { name, value, ...options } of authResponse.cookies.getAll()) {
      response.cookies.set(name, value, options)
    }
  }

  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))
  return response
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const nonce = generateNonce()
  const pathname = request.nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Get user session using the centralized database helper
  const { user, response: authResponse } = await getUser(request, NextResponse)

  // 1. If user is authenticated and tries to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. If user is NOT authenticated and tries to access any non-public route, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return createCspResponse(request, nonce, authResponse)
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
