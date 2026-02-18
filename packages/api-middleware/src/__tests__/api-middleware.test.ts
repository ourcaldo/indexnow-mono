import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock dependencies before importing the module
vi.mock('@indexnow/shared', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  getClientIP: vi.fn(() => '127.0.0.1'),
  AppConfig: {
    app: {
      environment: 'development',
      allowedOrigins: ['http://localhost:3000', 'https://app.example.com'],
    },
  },
  isDevelopment: vi.fn(() => true),
  isProduction: vi.fn(() => false),
}))

import {
  corsMiddleware,
  securityHeaders,
  rateLimit,
  composeMiddleware,
  requestLogger,
  type MiddlewareContext,
} from '../index'

function makeContext(method = 'GET', url = 'http://localhost:3000/api/v1/test', headers: Record<string, string> = {}): MiddlewareContext {
  const req = new NextRequest(url, {
    method,
    headers: new Headers(headers),
  })
  return { req }
}

const okHandler = async () => NextResponse.json({ success: true }, { status: 200 })

describe('corsMiddleware', () => {
  it('returns 204 for OPTIONS preflight with allowed origin', async () => {
    const ctx = makeContext('OPTIONS', 'http://localhost:3000/api/v1/test', {
      origin: 'http://localhost:3000',
    })
    const response = await corsMiddleware(ctx, okHandler)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })

  it('sets CORS headers on regular requests with allowed origin', async () => {
    const ctx = makeContext('GET', 'http://localhost:3000/api/v1/test', {
      origin: 'https://app.example.com',
    })
    const response = await corsMiddleware(ctx, okHandler)
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com')
  })

  it('does not set origin for disallowed origins', async () => {
    // For non-dev: Mock isDevelopment to return false
    const { isDevelopment } = await import('@indexnow/shared')
    vi.mocked(isDevelopment).mockReturnValueOnce(false)

    const ctx = makeContext('GET', 'http://localhost:3000/api/v1/test', {
      origin: 'https://evil.com',
    })
    const response = await corsMiddleware(ctx, okHandler)
    // Origin is not in allowed list, so no Access-Control-Allow-Origin
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

describe('securityHeaders', () => {
  it('sets all security headers', async () => {
    const ctx = makeContext()
    const response = await securityHeaders(ctx, okHandler)

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('Permissions-Policy')).toContain('camera=()')
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000')
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
  })
})

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear the rate limit store between tests by creating a fresh middleware
  })

  it('allows requests under the limit', async () => {
    const limiter = rateLimit(3, 60_000)
    const ctx = makeContext()

    // First 3 requests should pass
    const r1 = await limiter(ctx, okHandler)
    expect(r1.status).toBe(200)

    const r2 = await limiter(ctx, okHandler)
    expect(r2.status).toBe(200)

    const r3 = await limiter(ctx, okHandler)
    expect(r3.status).toBe(200)
  })

  it('blocks requests over the limit with 429', async () => {
    const limiter = rateLimit(2, 60_000)
    const ctx = makeContext()

    await limiter(ctx, okHandler) // 1
    await limiter(ctx, okHandler) // 2
    const r3 = await limiter(ctx, okHandler) // 3 — should be blocked

    expect(r3.status).toBe(429)
    const body = await r3.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Rate limit exceeded')
    expect(body.retryAfter).toBeGreaterThan(0)
  })
})

describe('composeMiddleware', () => {
  it('calls middlewares in correct order', async () => {
    const callOrder: number[] = []

    const mw1 = vi.fn(async (_ctx: MiddlewareContext, next: () => Promise<NextResponse>) => {
      callOrder.push(1)
      const response = await next()
      callOrder.push(4)
      return response
    })

    const mw2 = vi.fn(async (_ctx: MiddlewareContext, next: () => Promise<NextResponse>) => {
      callOrder.push(2)
      const response = await next()
      callOrder.push(3)
      return response
    })

    const composed = composeMiddleware(mw1, mw2)
    const ctx = makeContext()
    await composed(ctx, okHandler)

    expect(callOrder).toEqual([1, 2, 3, 4])
    expect(mw1).toHaveBeenCalled()
    expect(mw2).toHaveBeenCalled()
  })

  it('passes request through all middleware to final handler', async () => {
    const handler = vi.fn(async () => NextResponse.json({ data: 'ok' }))

    const passthrough = async (_ctx: MiddlewareContext, next: () => Promise<NextResponse>) => next()

    const composed = composeMiddleware(passthrough, passthrough)
    const ctx = makeContext()
    await composed(ctx, handler)

    expect(handler).toHaveBeenCalled()
  })

  it('allows early return from middleware', async () => {
    const earlyReturn = async () => NextResponse.json({ error: 'blocked' }, { status: 403 })
    const shouldNotRun = vi.fn(async (_ctx: MiddlewareContext, next: () => Promise<NextResponse>) => next())

    const composed = composeMiddleware(earlyReturn, shouldNotRun)
    const ctx = makeContext()
    const response = await composed(ctx, okHandler)

    expect(response.status).toBe(403)
    expect(shouldNotRun).not.toHaveBeenCalled()
  })
})

describe('requestLogger', () => {
  it('calls next and returns response', async () => {
    const ctx = makeContext()
    const response = await requestLogger(ctx, okHandler)
    expect(response.status).toBe(200)
  })
})
