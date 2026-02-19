import { NextRequest, NextResponse } from 'next/server';
import {
  corsMiddleware,
  securityHeaders,
  requestLogger,
  rateLimit,
  composeMiddleware,
  MiddlewareContext,
} from '@indexnow/api-middleware';

// 100 requests per 60 seconds per IP
const apiRateLimit = rateLimit(100, 60_000);

export async function middleware(request: NextRequest) {
  // Skip middleware for certain paths if needed
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const context = { req: request } as unknown as MiddlewareContext;

  // Compose and execute middlewares
  const composed = composeMiddleware(requestLogger, corsMiddleware, securityHeaders, apiRateLimit);

  // @ts-expect-error — (#V7 H-20) NextResponse from @indexnow/api-middleware resolves to a different pnpm physical path. Fix: pnpm overrides or shared next singleton.
  return (await composed(context, async () => {
    return NextResponse.next();
  })) as unknown as NextResponse;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
