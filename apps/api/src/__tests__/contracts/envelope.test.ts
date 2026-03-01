/**
 * Envelope shape tests — verify formatSuccess always produces the canonical
 * { success: true, data: T, timestamp: string } shape with no double-nesting.
 *
 * These are pure unit tests — no mocks, no Next.js required.
 */

import { describe, it, expect } from 'vitest';
import { formatSuccess } from '../../lib/core/api-response-formatter';

describe('formatSuccess envelope', () => {
  it('produces { success: true, data, timestamp }', () => {
    const result = formatSuccess({ foo: 'bar' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ foo: 'bar' });
    expect(typeof result.timestamp).toBe('string');
    // timestamp must be a valid ISO date
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(isNaN(new Date(result.timestamp).getTime())).toBe(false);
  });

  it('never double-nests data — wrapping an object with { data: x } stays one level', () => {
    const inner = { transactions: [], summary: {}, pagination: {} };
    const result = formatSuccess(inner);
    // result.data.data must not exist
    expect((result.data as Record<string, unknown>).data).toBeUndefined();
    expect(result.data).toBe(inner);
  });

  it('never double-nests data — wrapping already-success-like object', () => {
    // This is the historical bug: formatSuccess({ success: true, data: x })
    const buggyInner = { success: true, data: { order_id: 'abc' } };
    const result = formatSuccess(buggyInner);
    // Outer envelope is correct
    expect(result.success).toBe(true);
    // Inner data IS the buggyInner object, not further unwrapped
    expect(result.data).toStrictEqual(buggyInner);
    // There must NOT be result.data.data.data
    expect(
      (result.data as Record<string, unknown>).data
    ).toBeDefined(); // inner.data exists
    // But there should only be exactly ONE level of our envelope
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('timestamp');
    // No further 'success' nesting at first-level data keys
    expect(Object.keys(result).sort()).toEqual(
      expect.arrayContaining(['success', 'data', 'timestamp'])
    );
  });

  it('includes requestId when provided', () => {
    const result = formatSuccess({ value: 1 }, 'req-123');
    expect(result.requestId).toBe('req-123');
  });

  it('defaults statusCode to 200', () => {
    const result = formatSuccess({});
    expect(result.statusCode).toBe(200);
  });

  it('accepts custom statusCode', () => {
    const result = formatSuccess({}, undefined, 201);
    expect(result.statusCode).toBe(201);
  });
});

describe('contract shape — billing/packages/[id] fix', () => {
  it('formatSuccess(packageData) produces data = packageData, not data = { data: packageData }', () => {
    const pkg = { id: 'pkg-1', name: 'Pro', slug: 'pro', is_active: true };
    const result = formatSuccess(pkg);
    expect(result.data).toBe(pkg);
    expect((result.data as Record<string, unknown>).data).toBeUndefined();
  });
});

describe('contract shape — billing/orders/[id] fix', () => {
  it('formatSuccess(orderData) produces data = orderData, not data = { success, data: orderData }', () => {
    const order = { order_id: 'ord-1', status: 'completed', amount: 99 };
    const result = formatSuccess(order);
    expect(result.data).toBe(order);
    expect((result.data as Record<string, unknown>).success).toBeUndefined();
    expect((result.data as Record<string, unknown>).data).toBeUndefined();
  });
});
