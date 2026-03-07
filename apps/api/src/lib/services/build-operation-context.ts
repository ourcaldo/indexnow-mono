/**
 * Helper to build SecureServiceRoleWrapper operation context objects.
 * Eliminates ~5 lines of boilerplate per call site (ipAddress, userAgent,
 * endpoint/method metadata) across all route handlers.
 */

import { NextRequest } from 'next/server';
import { getClientIP } from '@indexnow/shared';

interface OperationContextOptions {
  operation: string;
  source: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Build a standardized operation context for SecureServiceRoleWrapper calls.
 * Auto-extracts ipAddress, userAgent, endpoint, and method from the request.
 */
export function buildOperationContext(
  request: NextRequest,
  userId: string,
  options: OperationContextOptions
) {
  return {
    userId,
    operation: options.operation,
    source: options.source,
    reason: options.reason,
    metadata: {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ...options.metadata,
    },
    ipAddress: getClientIP(request) ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
}
