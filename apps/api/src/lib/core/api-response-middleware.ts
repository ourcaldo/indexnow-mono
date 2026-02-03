/**
 * Enhanced API Response Middleware for Phase 2 Standardization
 * 
 * This module provides middleware that enforces standardized response formats
 * across ALL API routes (admin, authenticated, public) with automatic error handling,
 * logging, and monitoring integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerSuperAdminAuth } from '@indexnow/auth';
import { ErrorHandlingService, logger } from '../monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { formatSuccess, formatError, type ApiSuccessResponse, type ApiErrorResponse } from './api-response-formatter';
import { authenticateRequest, type AuthenticatedRequest } from './api-middleware';
import { AdminSecurityLogger } from '../services/security/AdminSecurityLogger';

// Re-export formatter functions for convenience
export { formatSuccess, formatError } from './api-response-formatter';
export type { ApiSuccessResponse, ApiErrorResponse } from './api-response-formatter';

/**
 * Admin API wrapper - Requires super admin authentication
 */
export function adminApiWrapper<T = unknown>(
  handler: (
    request: NextRequest, 
    adminUser: { id: string; email: string }, 
    context?: { params: Promise<any> }
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<any> }): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      // Verify super admin authentication
      const adminUser = await requireServerSuperAdminAuth(request);
      
      if (!adminUser) {
        const { ipAddress, userAgent } = AdminSecurityLogger.extractRequestMetadata(request);
        
        await AdminSecurityLogger.logUnauthorizedAccess({
          eventType: 'unauthorized_access',
          endpoint,
          method,
          ipAddress,
          userAgent,
          reason: 'Attempted to access admin endpoint without super admin privileges',
          requiredRole: 'super_admin',
          severity: 'high'
        });
        
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
    context?: { params: Promise<any> }
  ) => Promise<ApiSuccessResponse<T> | ApiErrorResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<any> }): Promise<NextResponse> => {
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
  handler: (request: NextRequest, context?: { params: Promise<any> }) => Promise<ApiSuccessResponse<T> | ApiErrorResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<any> }): Promise<NextResponse> => {
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      logger.debug({
        endpoint,
        method,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      }, `Public API access: ${method} ${endpoint}`);

      const response = await handler(request, context);
      
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
