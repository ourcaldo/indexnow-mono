/**
 * Contract test — GET /api/v1/billing/overview
 *
 * Validates:
 * - Standard envelope: { success: true, data: {...}, timestamp }
 * - Required top-level keys: currentSubscription, billingStats, recentTransactions
 * - billingStats shape: total_payments, total_spent, next_billing_date, days_remaining
 * - No double-nesting of data
 * - Graceful fallback when subscription / transactions queries fail
 * - Error path returns { success: false }
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
    createStandardError: vi.fn(),
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
  logger: {
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  },
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PROFILE = {
  user_id: 'test-user-id',
  package_id: 'pkg-1',
  subscription_end_date: null,
  subscription_start_date: null,
  package: {
    id: 'pkg-1',
    name: 'Pro',
    slug: 'pro',
    price: 99,
    billing_period: 'monthly',
  },
};

const SUBSCRIPTION = {
  id: 'sub-1',
  user_id: 'test-user-id',
  status: 'active',
  start_date: '2026-01-01T00:00:00Z',
  end_date: '2026-02-01T00:00:00Z',
  package: { name: 'Pro', slug: 'pro', price: 99, billing_period: 'monthly' },
};

const TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 99,
    currency: 'USD',
    status: 'completed',
    created_at: '2026-01-01T00:00:00Z',
    payment_method: 'bank_transfer',
    metadata: {},
    gateway_response: {},
    package: { name: 'Pro' },
    gateway: { name: 'BCA' },
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/billing/overview', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let executeWithUserSession: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@indexnow/database');
    executeWithUserSession = db.SecureServiceRoleWrapper.executeWithUserSession as ReturnType<typeof vi.fn>;
  });

  /** Wire 3 sequential executeWithUserSession calls: profile → subscription → transactions */
  function mockHappyPath() {
    executeWithUserSession
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: PROFILE, error: null }))
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: SUBSCRIPTION, error: null }))
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTIONS, error: null }))
      );
  }

  it('returns standard envelope { success, data, timestamp }', async () => {
    mockHappyPath();

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('data');
    expect(typeof body.timestamp).toBe('string');
  });

  it('data has top-level keys: currentSubscription, billingStats, recentTransactions', async () => {
    mockHappyPath();

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.data).toHaveProperty('currentSubscription');
    expect(body.data).toHaveProperty('billingStats');
    expect(body.data).toHaveProperty('recentTransactions');
  });

  it('billingStats has required fields', async () => {
    mockHappyPath();

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.data.billingStats).toMatchObject({
      total_payments: expect.any(Number),
      total_spent: expect.any(Number),
    });
    expect(body.data.billingStats).toHaveProperty('next_billing_date');
    expect(body.data.billingStats).toHaveProperty('days_remaining');
  });

  it('data is not double-nested (no data.data)', async () => {
    mockHappyPath();

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.data.data).toBeUndefined();
    expect(body.data.success).toBeUndefined();
  });

  it('recentTransactions is always an array', async () => {
    mockHappyPath();

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(Array.isArray(body.data.recentTransactions)).toBe(true);
  });

  it('returns success even when subscription query fails (graceful fallback)', async () => {
    // Use a profile WITHOUT a package_id so fallback also yields null
    const profileNoPackage = { ...PROFILE, package_id: null, package: null };
    executeWithUserSession
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: profileNoPackage, error: null }))
      )
      .mockRejectedValueOnce(new Error('Subscription DB error'))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((_: any, __: any, ___: any, cb: (db: any) => unknown) =>
        cb(makeDb({ data: TRANSACTIONS, error: null }))
      );

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    // Response should still be success — subscription error is swallowed
    expect(body.success).toBe(true);
    // With no subscription and profile has no package, currentSubscription is null
    expect(body.data.currentSubscription).toBeNull();
  });

  it('returns { success: false } when profile query fails', async () => {
    executeWithUserSession.mockRejectedValueOnce(new Error('Profile not found'));

    const { GET } = await import('../../app/api/v1/billing/overview/route');
    const req = new NextRequest('http://localhost/api/v1/billing/overview');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body).toHaveProperty('error');
  });
});
