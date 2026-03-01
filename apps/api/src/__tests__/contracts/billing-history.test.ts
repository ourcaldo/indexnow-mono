/**
 * Contract test — GET /api/v1/billing/history
 *
 * Validates:
 * - Standard envelope: { success: true, data: {...}, timestamp: string }
 * - Required fields in data: transactions[], summary{...}, pagination{...}
 * - No double-nesting of data
 * - RPC is called with correct argument names
 * - Error path returns { success: false }
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mocks must be declared before any import of the route under test ────────

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
    validateUuidParam: (v: unknown) => v ?? null,
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

// ─── Sample RPC fixture ───────────────────────────────────────────────────────
const RPC_SUCCESS = {
  data: {
    transactions: [
      {
        id: 'tx-1', order_id: 'tx-1', source: 'legacy', transaction_type: 'purchase',
        transaction_status: 'completed', amount: 100, currency: 'USD',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        notes: null, proof_url: null, payment_method: 'bank_transfer',
        external_transaction_id: null, package_name: 'Pro', billing_period: 'monthly',
        gateway_name: 'BCA', gateway_slug: 'bca',
      },
    ],
    total_count: 1,
    summary: {
      total_transactions: 1,
      completed_transactions: 1,
      pending_transactions: 0,
      failed_transactions: 0,
      total_amount_spent: 100,
    },
  },
  error: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/v1/billing/history', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rpcMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@indexnow/database');
    rpcMock = (db.supabaseAdmin.rpc as ReturnType<typeof vi.fn>);
  });

  it('returns standard envelope { success, data, timestamp }', async () => {
    rpcMock.mockResolvedValueOnce(RPC_SUCCESS);

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history?page=1&limit=10');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('data');
    expect(typeof body.timestamp).toBe('string');
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it('data contains required fields: transactions, summary, pagination', async () => {
    rpcMock.mockResolvedValueOnce(RPC_SUCCESS);

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(Array.isArray(body.data.transactions)).toBe(true);
    expect(body.data.summary).toMatchObject({
      total_transactions: expect.any(Number),
      completed_transactions: expect.any(Number),
      pending_transactions: expect.any(Number),
      failed_transactions: expect.any(Number),
      total_amount_spent: expect.any(Number),
    });
    expect(body.data.pagination).toMatchObject({
      current_page: expect.any(Number),
      total_pages: expect.any(Number),
      total_items: expect.any(Number),
      items_per_page: expect.any(Number),
      has_next: expect.any(Boolean),
      has_prev: expect.any(Boolean),
    });
  });

  it('data is not double-nested (no data.data)', async () => {
    rpcMock.mockResolvedValueOnce(RPC_SUCCESS);

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.data.data).toBeUndefined();
  });

  it('calls RPC with correct argument names (p_user_id, p_page, p_limit, p_status)', async () => {
    rpcMock.mockResolvedValueOnce(RPC_SUCCESS);

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history?page=2&limit=5');
    await GET(req as never, { params: Promise.resolve({}) } as never);

    expect(rpcMock).toHaveBeenCalledWith('get_user_billing_history', {
      p_user_id: 'test-user-id',
      p_page: 2,
      p_limit: 5,
      p_status: null,
    });
  });

  it('pagination has_prev=false on page 1, has_next matches total_pages', async () => {
    rpcMock.mockResolvedValueOnce({
      data: { ...RPC_SUCCESS.data, total_count: 25 },
      error: null,
    });

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history?page=1&limit=10');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.data.pagination.has_prev).toBe(false);
    expect(body.data.pagination.has_next).toBe(true);
    expect(body.data.pagination.total_pages).toBe(3);
  });

  it('returns { success: false } on RPC error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('RPC failure') });

    const { GET } = await import('../../app/api/v1/billing/history/route');
    const req = new NextRequest('http://localhost/api/v1/billing/history');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body).toHaveProperty('error');
  });
});
