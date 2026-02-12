import { NextRequest, NextResponse } from 'next/server';
import { requireServerSuperAdminAuth, type AdminUser } from '@indexnow/auth';
import { ErrorHandlingService, logger } from '../monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { formatSuccess, formatError, type ApiSuccessResponse, type ApiErrorResponse } from './api-response-formatter';
import { authenticateRequest, type AuthenticatedRequest } from './api-middleware';

// Re-export formatter functions for convenience
export { formatSuccess, formatError } from './api-response-formatter';
export type { ApiSuccessResponse, ApiErrorResponse } from './api-response-formatter';

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
    metadata?: Record<string, any>;
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
    context?: { params: Promise<Record<string, string>> }
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
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
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
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

      const response = await handler(request, adminUser, context);

      if (response instanceof NextResponse) {
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode });
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

      return NextResponse.json(formatError(structuredError), { status: 500 });
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
    context?: { params: Promise<Record<string, string>> }
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      const authResult = await authenticateRequest(request, endpoint, method);

      if (!authResult.success) {
        return NextResponse.json(formatError(authResult.error as StructuredError), { status: (authResult.error as StructuredError).statusCode || 401 });
      }

      logger.debug({
        userId: authResult.data.userId,
        endpoint,
        method,
        userEmail: authResult.data.user.email
      }, `Authenticated API access: ${method} ${endpoint}`);

      const response = await handler(request, authResult.data, context);

      if (response instanceof NextResponse) {
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode });
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

      return NextResponse.json(formatError(structuredError), { status: 500 });
    }
  };
}

/**
 * Public API wrapper - No authentication required
 */
export function publicApiWrapper<T = unknown>(
  handler: (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<ApiSuccessResponse<T> | ApiErrorResponse | NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      logger.debug({
        endpoint,
        method,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      }, `Public API access: ${method} ${endpoint}`);

      const response = await handler(request, context);

      if (response instanceof NextResponse) {
        return response;
      }

      if (response.success) {
        const statusCode = response.statusCode || 200;
        return NextResponse.json(response, { status: statusCode });
      } else {
        const statusCode = response.error.statusCode || 500;
        return NextResponse.json(response, { status: statusCode });
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

      return NextResponse.json(formatError(structuredError), { status: 500 });
    }
  };
}
