/**
 * Contract test — GET /api/v1/billing/orders/[id]
 *
 * Validates:
 * - Phase 1 regression guard: orderData is returned directly, NOT wrapped in a second envelope
 * - Standard envelope: { success: true, data: {...}, timestamp }
 * - Required fields in data: order_id, status, amount, currency, payment_method, package
 * - No inner { success, data } keys (the pre-fix double-nesting bug)
 * - 404 path when transaction not found
 * - 400 path when id param is missing
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/core/api-response-middleware', async () => {
  const { formatSuccess, formatError } = await import('../../lib/core/api-response-formatter');
  const { NextResponse } = await import('next/server');
  return {
    authenticatedApiWrapper:
      (handler: (...a: never[]) => Promise<unknown>) =>
      async (req: unknown, ctx: unknown) => {
        const response = await handler(
          req as never,
          { userId: 'test-user-id', supabase: {}, user: {} } as never,
          ctx as never
        );
        if (response instanceof NextResponse) return response;
        const r = response as Record<string, unknown>;
        const statusCode = r.success
          ? ((r.statusCode as number) ?? 200)
          : (((r.error as Record<string, unknown>)?.statusCode as number) ?? 500);
        return NextResponse.json(response, { status: statusCode });
      },
    formatSuccess,
    formatError,
    // createStandardError is called for 400/404 — return a minimal structured error
    createStandardError: vi.fn().mockResolvedValue({
      id: 'err-id',
      type: 'not_found',
      message: 'Not found',
      userMessage: 'Not found',
      severity: 'low',
      statusCode: 404,
      timestamp: new Date(),
    }),
  };
});

vi.mock('@indexnow/database', () => ({
  supabaseAdmin: { rpc: vi.fn() },
  SecureServiceRoleWrapper: { executeWithUserSession: vi.fn() },
  asTypedClient: (x: unknown) => x,
}));

vi.mock('@/lib/monitoring/error-handling', () => ({
  ErrorHandlingService: {
    createError: vi.fn().mockResolvedValue({
      id: 'err-id', type: 'database', message: 'DB error',
      userMessage: 'Error', severity: 'high', statusCode: 500, timestamp: new Date(),
    }),
  },
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ─── Fluent query mock builder ───────────────────────────────────────────────

type QueryResult<T> = { data: T; error: null } | { data: null; error: Error };

function makeDb<T>(result: QueryResult<T>) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve(result);
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.limit = () => chain;
  chain.single = terminal;
  chain.maybeSingle = terminal;
  return { from: () => chain };
}

// ─── Fixture ─────────────────────────────────────────────────────────────────

const TRANSACTION = {
  id: 'order-abc-123',
  user_id: 'test-user-id',
  status: 'completed',
  amount: 99,
  currency: 'USD',
  payment_method: 'bank_transfer',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  metadata: { billing_period: 'monthly', customer_info: {} },
  gateway_response: {},
  package: {
    id: 'pkg-1', name: 'Pro', description: 'Pro plan',
    features: [], quota_limits: {},
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/billing/orders/[id]', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let executeWithUserSession: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@indexnow/database');
    executeWithUserSession = db.SecureServiceRoleWrapper.executeWithUserSession as ReturnType<typeof vi.fn>;
  });

  it('returns standard envelope { success, data, timestamp }', async () => {
    executeWithUserSession.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTION, error: null }))
    );

    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/order-abc-123');
    const res = await GET(req as never, { params: Promise.resolve({ id: 'order-abc-123' }) } as never);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('data');
    expect(typeof body.timestamp).toBe('string');
  });

  it('data has required fields: order_id, status, amount, currency, payment_method, package', async () => {
    executeWithUserSession.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTION, error: null }))
    );

    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/order-abc-123');
    const res = await GET(req as never, { params: Promise.resolve({ id: 'order-abc-123' }) } as never);
    const body = await res.json();

    expect(body.data).toMatchObject({
      order_id: expect.any(String),
      status: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String),
      payment_method: expect.any(String),
    });
    expect(body.data).toHaveProperty('package');
  });

  it('[Phase 1 regression] data has NO inner { success } or { data } keys (was double-nested before fix)', async () => {
    executeWithUserSession.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTION, error: null }))
    );

    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/order-abc-123');
    const res = await GET(req as never, { params: Promise.resolve({ id: 'order-abc-123' }) } as never);
    const body = await res.json();

    // The bug was: body.data = { success: true, data: { order_id, ... }, timestamp }
    // After fix: body.data = { order_id, status, amount, ... }
    expect(body.data.success).toBeUndefined();
    expect(body.data.data).toBeUndefined();
    expect(body.data.timestamp).toBeUndefined();
  });

  it('order_id in response matches the requested id', async () => {
    executeWithUserSession.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTION, error: null }))
    );

    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/order-abc-123');
    const res = await GET(req as never, { params: Promise.resolve({ id: 'order-abc-123' }) } as never);
    const body = await res.json();

    expect(body.data.order_id).toBe('order-abc-123');
  });

  it('returns { success: false } with 404 when transaction not found', async () => {
    // Callback returns null → route calls formatError with NOT_FOUND
    executeWithUserSession.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: null, error: null }))
    );

    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/nonexistent');
    const res = await GET(req as never, { params: Promise.resolve({ id: 'nonexistent' }) } as never);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body).toHaveProperty('error');
  });

  it('returns { success: false } with 400 when id param is missing', async () => {
    const { GET } = await import('../../app/api/v1/billing/orders/[id]/route');
    const req = new NextRequest('http://localhost/api/v1/billing/orders/undefined');
    // Pass empty params — id will be undefined
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(false);
  });
});
