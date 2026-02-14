/**
 * API Middleware for IndexNow Studio
 * Handles request/response interceptors and common middleware functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { type Json } from '../../types/common/Json';
import { AppConfig, isDevelopment } from '../config/AppConfig';
import { logger } from '../../utils/logger';

export interface MiddlewareContext {
  req: NextRequest;
  res?: NextResponse;
  userId?: string;
  userRole?: string;
}

export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

// Request logging middleware
export const requestLogger: MiddlewareFunction = async (context, next) => {
  const start = Date.now();
  const { req } = context;

  const response = await next();

  const duration = Date.now() - start;
  const logData: Record<string, Json> = {
    method: req.method,
    url: req.url,
    status: response.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  };

  // Log all requests
  logger.debug(logData, '[API Request]');

  return response;
};

// CORS middleware
export const corsMiddleware: MiddlewareFunction = async (context, next) => {
  const { req } = context;
  const origin = req.headers.get('origin');
  const allowedOrigins = AppConfig.app.allowedOrigins;

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });

    if (origin && allowedOrigins.includes(origin)) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!origin && isDevelopment()) {
      // Allow local development without origin header (e.g. Postman)
      preflightResponse.headers.set('Access-Control-Allow-Origin', '*');
    }

    preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-api-key, x-signature, x-timestamp');
    preflightResponse.headers.set('Access-Control-Max-Age', '86400');
    preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');

    return preflightResponse;
  }

  const response = await next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (!origin && isDevelopment()) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-api-key, x-signature, x-timestamp');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
};

// Security headers middleware
export const securityHeaders: MiddlewareFunction = async (context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number): MiddlewareFunction => {
  return async (context, next) => {
    const { req } = context;
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();

    const current = rateLimitStore.get(clientId);

    if (!current || now > current.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      );
    }

    current.count++;
    return next();
  };
};

// Middleware composer
export const composeMiddleware = (...middlewares: MiddlewareFunction[]) => {
  return async (context: MiddlewareContext, finalHandler: () => Promise<NextResponse>) => {
    let index = 0;

    const next = async (): Promise<NextResponse> => {
      if (index >= middlewares.length) {
        return finalHandler();
      }

      const middleware = middlewares[index++];
      return middleware(context, next);
    };

    return next();
  };
};
