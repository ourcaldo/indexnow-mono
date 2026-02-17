import { NextRequest, NextResponse } from 'next/server';
import { requireServerSuperAdminAuth } from '@indexnow/auth/server';
import { type AdminUser } from '@indexnow/auth';
import { ErrorHandlingService, logger } from '../monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Json , getClientIP} from '@indexnow/shared';
import { formatSuccess, formatError, type ApiSuccessResponse, type ApiErrorResponse } from './api-response-formatter';
import { authenticateRequest, type AuthenticatedRequest } from './api-middleware';
import { validateUuidParam } from './validate-params';

// Re-export formatter functions for convenience
export { formatSuccess, formatError } from './api-response-formatter';
export type { ApiSuccessResponse, ApiErrorResponse } from './api-response-formatter';
export { validateUuidParam } from './validate-params';

/** Route context type compatible with Next.js 16 (supports dynamic, catch-all & optional catch-all params) */
type RouteContext = { params: Promise<Record<string, string | string[]>> };

/**
 * UUID regex for validating route param IDs
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate all route param values that look like IDs are valid UUIDs.
 * Returns an error response if any param named 'id' (or ending in 'Id') is not a valid UUID.
 * Returns null if all params are valid.
 */
async function validateRouteParams(context: RouteContext): Promise<NextResponse | null> {
  try {
    const params = await context.params;
    for (const [key, value] of Object.entries(params)) {
      // Only validate params that are ID-like (named 'id' or containing 'id'/'Id')
      if (typeof value === 'string' && (key === 'id' || key.toLowerCase().endsWith('id'))) {
        if (!UUID_REGEX.test(value)) {
          const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            `Invalid ${key} format — must be a valid UUID`,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
          );
          return NextResponse.json(formatError(error), { status: 400 });
        }
      }
    }
  } catch {
    // If params resolution fails, let the handler deal with it
  }
  return null;
}

/**
 * Standard Cache-Control headers.
 * - Private/sensitive: no-store (admin, authenticated)
 * - Public: no-cache, must revalidate
 */
const CACHE_HEADERS = {
  private: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  public: { 'Cache-Control': 'no-cache, must-revalidate' },
} as const;

/**
 * Create a standard error response
 */
export async function createStandardError(
  type: ErrorType,
  error: Error | string,
  options: {
    severity?: ErrorSeverity;
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    metadata?: Record<string, Json>;
    userMessageKey?: string;
  } = {}
) {
  return ErrorHandlingService.createError(type, error, options);
}

/**
 * Admin API wrapper - Requires super admin authentication
 */
export function adminApiWrapper<T = unknown>(
  handler: (
    request: NextRequest,
    adminUser: AdminUser,
    context: RouteContext
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      // Verify super admin authentication
      let adminUser: AdminUser | null = null;
      try {
        adminUser = await requireServerSuperAdminAuth(request);
      } catch (error) {
        // If auth fails, requireServerSuperAdminAuth throws. 
        // We catch it here to allow the custom unauthorized handling below.
        adminUser = null;
      }

      if (!adminUser) {
        const ipAddress = getClientIP(request) ?? 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        logger.warn({
          eventType: 'unauthorized_access',
          endpoint,
          method,
          ipAddress,
          userAgent,
          reason: 'Attempted to access admin endpoint without super admin privileges',
          requiredRole: 'super_admin',
          severity: 'high'
        }, `Unauthorized admin access attempt: ${method} ${endpoint}`);

        const error = await ErrorHandlingService.createError(
          ErrorType.AUTHORIZATION,
          'Super admin access required',
          {
            severity: ErrorSeverity.MEDIUM,
            endpoint,
            method,
            statusCode: 403,
            userMessageKey: 'default'
          }
        );

        return NextResponse.json(formatError(error), { status: 403 });
      }

      logger.info({
        userId: adminUser.id,
        endpoint,
        method,
        adminEmail: adminUser.email
      }, `Admin API access: ${method} ${endpoint}`);

      // Validate UUID route params before running handler
      const paramError = await validateRouteParams(context);
      if (paramError) return paramError;

      const response = await handler(request, adminUser, context);

      if (response instanceof NextResponse) {
        // Set cache headers on passthrough responses if not already set
        if (!response.headers.has('Cache-Control')) {
          response.headers.set('Cache-Control', CACHE_HEADERS.private['Cache-Control']);
        }
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.private });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.private });
      }

    } catch (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.SYSTEM,
        error as Error,
        {
          severity: ErrorSeverity.HIGH,
          endpoint,
          method,
          statusCode: 500,
          userMessageKey: 'default'
        }
      );

      return NextResponse.json(formatError(structuredError), { status: 500, headers: CACHE_HEADERS.private });
    }
  };
}

/**
 * Authenticated API wrapper - Requires user authentication
 */
export function authenticatedApiWrapper<T = unknown>(
  handler: (
    request: NextRequest,
    auth: AuthenticatedRequest,
    context: RouteContext
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      const authResult = await authenticateRequest(request, endpoint, method);

      if (!authResult.success) {
        return NextResponse.json(formatError(authResult.error), { status: authResult.error.statusCode || 401 });
      }

      logger.debug({
        userId: authResult.data.userId,
        endpoint,
        method,
        userEmail: authResult.data.user.email
      }, `Authenticated API access: ${method} ${endpoint}`);

      // Validate UUID route params before running handler
      const paramError = await validateRouteParams(context);
      if (paramError) return paramError;

      const response = await handler(request, authResult.data, context);

      if (response instanceof NextResponse) {
        if (!response.headers.has('Cache-Control')) {
          response.headers.set('Cache-Control', CACHE_HEADERS.private['Cache-Control']);
        }
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.private });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.private });
      }

    } catch (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.SYSTEM,
        error as Error,
        {
          severity: ErrorSeverity.HIGH,
          endpoint,
          method,
          statusCode: 500,
          userMessageKey: 'default'
        }
      );

      return NextResponse.json(formatError(structuredError), { status: 500, headers: CACHE_HEADERS.private });
    }
  };
}

/**
 * Public API wrapper - No authentication required
 */
export function publicApiWrapper<T = unknown>(
  handler: (request: NextRequest, context: RouteContext) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      logger.debug({
        endpoint,
        method,
        ipAddress: getClientIP(request) ?? 'unknown'
      }, `Public API access: ${method} ${endpoint}`);

      // Validate UUID route params before running handler
      const paramError = await validateRouteParams(context);
      if (paramError) return paramError;

      const response = await handler(request, context);

      if (response instanceof NextResponse) {
        if (!response.headers.has('Cache-Control')) {
          response.headers.set('Cache-Control', CACHE_HEADERS.public['Cache-Control']);
        }
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.public });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode, headers: CACHE_HEADERS.public });
      }

    } catch (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.SYSTEM,
        error as Error,
        {
          severity: ErrorSeverity.MEDIUM,
          endpoint,
          method,
          statusCode: 500,
          userMessageKey: 'default'
        }
      );

      return NextResponse.json(formatError(structuredError), { status: 500, headers: CACHE_HEADERS.public });
    }
  };
}

/**
 * Wrapper that executes a database operation with standardized error handling.
 * Returns { success, data } on success, or a NextResponse error on failure.
 */
export async function withDatabaseOperation<T>(
  operation: () => Promise<T>,
  _context: { userId: string; endpoint: string }
): Promise<{ success: true; data: T } | NextResponse> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database operation failed';
    logger.error({ error: err instanceof Error ? err : undefined }, message);
    const structuredError = ErrorHandlingService.createError({
      message,
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
    });
    return NextResponse.json(formatError(structuredError), { status: 500 });
  }
}
