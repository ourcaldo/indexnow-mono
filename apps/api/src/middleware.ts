import { NextRequest, NextResponse } from 'next/server'
import { AppConfig } from '@indexnow/shared'

/**
 * API Application Middleware
 * Handles global CORS and ensures only API routes are processed
 */

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // 1. Ensure only /api paths are accessible
  if (!pathname.startsWith('/api')) {
    return new NextResponse(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const response = NextResponse.next()

  // 2. Global CORS Headers
  const origin = request.headers.get('origin')
  const allowedOrigins = AppConfig.app.allowedOrigins

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control')
  response.headers.set('Access-Control-Max-Age', '86400')

  // 3. Handle Preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
