/**
 * Contract test — GET /api/v1/rank-tracking/weekly-trends
 *
 * Validates:
 * - Standard envelope: { success: true, data: [...], timestamp }
 * - data is an array
 * - Each item has: id, keyword, domain, current_position, previous_position, change
 * - No double-nesting of data
 * - Correct RPC argument names
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
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const TREND_ITEMS = [
  {
    id: 'kw-1', keyword: 'indexnow api', domain: 'example.com',
    current_position: 5, previous_position: 8, change: 3,
    sparkline: [9, 8, 7, 6, 5, 5, 5],
  },
  {
    id: 'kw-2', keyword: 'seo tool', domain: 'example.com',
    current_position: 12, previous_position: 12, change: 0,
    sparkline: [12, 12, 13, 12, 11, 12, 12],
  },
];

describe('GET /api/v1/rank-tracking/weekly-trends', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rpcMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@indexnow/database');
    rpcMock = (db.supabaseAdmin.rpc as ReturnType<typeof vi.fn>);
  });

  it('returns standard envelope { success, data, timestamp }', async () => {
    rpcMock.mockResolvedValueOnce({ data: TREND_ITEMS, error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body).toHaveProperty('data');
    expect(typeof body.timestamp).toBe('string');
  });

  it('data is an array', async () => {
    rpcMock.mockResolvedValueOnce({ data: TREND_ITEMS, error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('each item has required fields: id, keyword, domain, current_position, previous_position, change', async () => {
    rpcMock.mockResolvedValueOnce({ data: TREND_ITEMS, error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    for (const item of body.data) {
      expect(item).toMatchObject({
        id: expect.any(String),
        keyword: expect.any(String),
        domain: expect.any(String),
        current_position: expect.any(Number),
        previous_position: expect.any(Number),
        change: expect.any(Number),
      });
    }
  });

  it('data is not double-nested (no data.data)', async () => {
    rpcMock.mockResolvedValueOnce({ data: TREND_ITEMS, error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    // data should be a plain array, not { data: [...] }
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.data).toBeUndefined();
  });

  it('calls RPC with correct argument name p_user_id', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    await GET(req as never, { params: Promise.resolve({}) } as never);

    expect(rpcMock).toHaveBeenCalledWith('get_user_weekly_trends', { p_user_id: 'test-user-id' });
  });

  it('returns empty array when RPC returns null', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns { success: false } on RPC error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('RPC timeout') });

    const { GET } = await import('../../app/api/v1/rank-tracking/weekly-trends/route');
    const req = new NextRequest('http://localhost/api/v1/rank-tracking/weekly-trends');
    const res = await GET(req as never, { params: Promise.resolve({}) } as never);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body).toHaveProperty('error');
  });
});
