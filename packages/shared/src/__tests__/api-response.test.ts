import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatSuccess, formatError } from '../core/api-response';
import { ErrorType, ErrorSeverity } from '../types/common/ErrorTypes';

// Mock the AppConfig module to control isProduction()
vi.mock('../core/config/AppConfig', () => ({
  isProduction: vi.fn(() => false),
  AppConfig: {
    app: { environment: 'development' },
  },
}));

describe('formatSuccess', () => {
  it('returns a success response with correct structure', () => {
    const result = formatSuccess({ items: [1, 2, 3] });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ items: [1, 2, 3] });
    expect(result.timestamp).toBeDefined();
    expect(result.statusCode).toBe(200);
    expect(result.requestId).toBeUndefined();
  });

  it('includes requestId when provided', () => {
    const result = formatSuccess('hello', 'req-123');

    expect(result.requestId).toBe('req-123');
    expect(result.data).toBe('hello');
  });

  it('uses custom status code when provided', () => {
    const result = formatSuccess(null, undefined, 201);

    expect(result.statusCode).toBe(201);
  });

  it('generates a valid ISO timestamp', () => {
    const before = new Date().toISOString();
    const result = formatSuccess({});
    const after = new Date().toISOString();

    expect(result.timestamp >= before).toBe(true);
    expect(result.timestamp <= after).toBe(true);
  });

  it('preserves generic type of data', () => {
    interface User {
      id: number;
      name: string;
    }
    const user: User = { id: 1, name: 'Test' };
    const result = formatSuccess<User>(user);

    expect(result.data.id).toBe(1);
    expect(result.data.name).toBe('Test');
  });
});

describe('formatError', () => {
  const baseError = {
    id: 'err-001',
    type: ErrorType.VALIDATION,
    message: 'Internal validation failed on field X',
    userMessage: 'Please check your input',
    severity: ErrorSeverity.MEDIUM,
    timestamp: new Date('2024-01-15T10:00:00Z'),
    statusCode: 400,
  };

  beforeEach(() => {
    vi.resetModules();
  });

  it('returns an error response with correct structure', () => {
    const result = formatError(baseError);

    expect(result.success).toBe(false);
    expect(result.error.id).toBe('err-001');
    expect(result.error.type).toBe(ErrorType.VALIDATION);
    expect(result.error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(result.error.statusCode).toBe(400);
    expect(result.error.timestamp).toBe('2024-01-15T10:00:00.000Z');
  });

  it('shows internal message in development mode', () => {
    const result = formatError(baseError);

    expect(result.error.message).toBe('Internal validation failed on field X');
    expect(result.error.userMessage).toBe('Please check your input');
  });

  it('includes requestId when provided', () => {
    const result = formatError(baseError, 'req-456');

    expect(result.requestId).toBe('req-456');
  });

  it('handles error without userMessage', () => {
    const errorWithoutUserMsg = { ...baseError, userMessage: undefined };
    const result = formatError(errorWithoutUserMsg);

    expect(result.error.userMessage).toBeUndefined();
  });

  it('preserves details in development mode', () => {
    const errorWithDetails = {
      ...baseError,
      details: {
        message: 'Internal detail',
        stack: 'Error at line 42',
        metadata: { field: 'email' },
        validationErrors: [{ path: 'email', message: 'Invalid format' }],
      },
    };
    const result = formatError(errorWithDetails);

    expect(result.error.details).toBeDefined();
    expect(result.error.details?.validationErrors).toHaveLength(1);
  });

  it('strips sensitive details in production mode', async () => {
    // Re-import with production mock
    vi.doMock('../core/config/AppConfig', () => ({
      isProduction: vi.fn(() => true),
      AppConfig: {
        app: { environment: 'production' },
      },
    }));

    const { formatError: formatErrorProd } = await import('../core/api-response');

    const errorWithDetails = {
      ...baseError,
      details: {
        message: 'Internal detail',
        stack: 'Error at line 42',
        metadata: { secret: 'value' },
        validationErrors: [{ path: 'email', message: 'Invalid format' }],
      },
    };
    const result = formatErrorProd(errorWithDetails);

    expect(result.error.message).toBe('Please check your input');
    expect(result.error.details?.validationErrors).toHaveLength(1);
    // Sensitive fields should be stripped
    expect(result.error.details).not.toHaveProperty('stack');
    expect(result.error.details).not.toHaveProperty('message');
    expect(result.error.details).not.toHaveProperty('metadata');
  });

  it('uses fallback message in production when userMessage is missing', async () => {
    vi.doMock('../core/config/AppConfig', () => ({
      isProduction: vi.fn(() => true),
      AppConfig: {
        app: { environment: 'production' },
      },
    }));

    const { formatError: formatErrorProd } = await import('../core/api-response');

    const errorWithoutUserMsg = { ...baseError, userMessage: undefined };
    const result = formatErrorProd(errorWithoutUserMsg);

    expect(result.error.message).toBe('An unexpected error occurred');
  });

  it('handles all error types', () => {
    const errorTypes = Object.values(ErrorType);
    for (const type of errorTypes) {
      const result = formatError({ ...baseError, type });
      expect(result.error.type).toBe(type);
    }
  });
});
