/**
 * Shared mock factory for API contract tests.
 *
 * Usage in each test file — call these vi.mock() calls BEFORE any imports
 * of the route under test (hoisting required):
 *
 *   vi.mock('@/lib/core/api-response-middleware', mockAuthMiddleware)
 *   vi.mock('@indexnow/database', mockDatabase)
 *   vi.mock('@/lib/monitoring/error-handling', mockErrorHandling)
 */
import { vi } from 'vitest';

// ─── Standard fake auth context injected by mockAuthMiddleware ──────────────
export const FAKE_AUTH = {
  userId: 'test-user-id',
  supabase: {} as never,
  user: { id: 'test-user-id', email: 'test@example.com' } as never,
};

// ─── Mock: auth middleware — bypasses authentication, injects FAKE_AUTH ─────
export const mockAuthMiddleware = async () => {
  const { formatSuccess, formatError } = await import('../../lib/core/api-response-formatter');
  return {
    authenticatedApiWrapper:
      (handler: (...args: never[]) => Promise<unknown>) =>
      (req: unknown, ctx: unknown) =>
        handler(req as never, FAKE_AUTH as never, ctx as never),
    publicApiWrapper:
      (handler: (...args: never[]) => Promise<unknown>) =>
      (req: unknown, ctx: unknown) =>
        handler(req as never, ctx as never),
    formatSuccess,
    formatError,
    createStandardError: vi.fn(),
    validateUuidParam: (v: string | undefined | null) => v ?? null,
  };
};

// ─── Mock: @indexnow/database ────────────────────────────────────────────────
export const mockDatabase = () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      is:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
  SecureServiceRoleWrapper: {
    executeWithUserSession: vi.fn(),
    executeSecureOperation: vi.fn(),
  },
  asTypedClient: (x: unknown) => x,
  createServerClient: vi.fn(),
});

// ─── Mock: error handling ─────────────────────────────────────────────────────
export const mockErrorHandling = () => ({
  ErrorHandlingService: {
    createError: vi.fn().mockResolvedValue({
      id:          'test-error-id',
      type:        'database',
      message:     'Test error',
      userMessage: 'An error occurred',
      severity:    'high',
      statusCode:  500,
      timestamp:   new Date(),
    }),
  },
  logger: {
    info:  vi.fn(),
    error: vi.fn(),
    warn:  vi.fn(),
    debug: vi.fn(),
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a NextResponse (or plain Response) body as JSON */
export async function parseBody(response: unknown): Promise<Record<string, unknown>> {
  return (response as Response).json();
}

/** Returns true if the response is a standard success envelope */
export function isSuccessEnvelope(body: Record<string, unknown>) {
  return (
    body.success === true &&
    'data' in body &&
    typeof body.timestamp === 'string'
  );
}
