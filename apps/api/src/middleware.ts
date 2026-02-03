import { NextRequest, NextResponse } from 'next/server';
import { 
  corsMiddleware, 
  securityHeaders, 
  composeMiddleware,
  MiddlewareContext
} from '@indexnow/shared';

export async function middleware(request: NextRequest) {
  // Skip middleware for certain paths if needed
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const context: MiddlewareContext = { req: request };
  
  // Compose and execute middlewares
  const composed = composeMiddleware(
    corsMiddleware,
    securityHeaders
  );

  return composed(context, async () => {
    return NextResponse.next();
  });
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
