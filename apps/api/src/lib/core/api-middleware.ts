import { NextRequest } from 'next/server';
import { createTokenClient, type Database } from '@indexnow/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  ErrorHandlingService, 
  ErrorType, 
  ErrorSeverity, 
  CommonErrors, 
  logger, 
  isTransientError 
} from '../monitoring/error-handling';
import { formatSuccess, formatError } from './api-response-formatter';
import { StructuredError } from '@indexnow/shared';

// Re-export formatting functions for use in API routes
export { formatSuccess, formatError } from './api-response-formatter';
export type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './api-response-formatter';

/**
 * API-specific authenticated request — extends the shared base definition
 * with a Supabase client instance for database operations.
 * The shared AuthenticatedRequest (in @indexnow/shared) is a generic type
 * for use across packages; this one is specific to the API runtime.
 */
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
  userId: string;
  supabase: SupabaseClient<Database>;
}

/**
 * Enhanced authentication middleware with comprehensive error handling
 */
export async function authenticateRequest(
  request: NextRequest,
  endpoint?: string,
  method?: string
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; error: StructuredError }> {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const error = await CommonErrors.UNAUTHORIZED();
      return { success: false, error };
    }

    const token = authHeader.substring(7);
    
    // Create user-authenticated Supabase client
    const supabase = createTokenClient(token);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      if (isTransientError(authError)) {
        logger.warn({
          endpoint,
          method,
          errorMessage: authError.message,
          errorCode: authError.code,
          errorStatus: authError.status
        }, 'Transient error during authentication - service/network issue detected');
        
        const structuredError = await CommonErrors.SERVICE_UNAVAILABLE(
          'Supabase Auth',
          authError.message
        );
        return { success: false, error: structuredError };
      }
      
      logger.info({
        endpoint,
        method,
        errorMessage: authError.message,
        errorCode: authError.code
      }, 'Authentication failed - invalid or expired token');
      
      throw new Error('Invalid authentication token');
    }
    
    if (!user) {
      logger.info({ endpoint, method }, 'Authentication failed - no user found');
      throw new Error('Invalid authentication token');
    }

    logger.debug({
      userId: user.id,
      email: user.email,
      endpoint,
      method
    }, 'User authenticated successfully');

    return { 
      success: true, 
      data: { 
        user: { id: user.id, email: user.email! },
        userId: user.id,
        supabase: supabase as SupabaseClient<Database>
      } 
    };
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.AUTHENTICATION,
      error as Error,
      {
        severity: ErrorSeverity.HIGH,
        endpoint,
        method,
        statusCode: 401,
        userMessageKey: 'default'
      }
    );
    return { success: false, error: structuredError };
  }
}

/**
 * Validate request with Zod schema
 */
export async function validateRequest<T = unknown>(
  request: NextRequest,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { errors: { path: (string | number)[]; message: string }[] } } },
  userId?: string,
  endpoint?: string
): Promise<{ success: true; data: T } | { success: false; error: unknown }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const validationDetails = result.error.errors
        .map((err: { path: (string | number)[]; message: string }) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        `Validation failed: ${validationDetails}`,
        {
          severity: ErrorSeverity.LOW,
          userId,
          endpoint,
          statusCode: 400,
          userMessageKey: 'invalid_format',
          metadata: { validationErrors: result.error.errors }
        }
      );
      return { success: false, error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      error as Error,
      {
        severity: ErrorSeverity.MEDIUM,
        userId,
        endpoint,
        statusCode: 400,
        userMessageKey: 'invalid_format'
      }
    );
    return { success: false, error: structuredError };
  }
}

/**
 * Database operation wrapper with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  userId?: string,
  endpoint?: string
): Promise<{ success: true; data: T } | { success: false; error: unknown }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error as Error,
      {
        severity: ErrorSeverity.HIGH,
        userId,
        endpoint,
        statusCode: 500,
        userMessageKey: 'query_failed',
        metadata: { operation: operationName }
      }
    );
    return { success: false, error: structuredError };
  }
}

/**
 * Create standardized API response helper
 */
export function createApiResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create error response from structured error
 */
export function createErrorResponse(error: StructuredError) {
  const responseData = ErrorHandlingService.createErrorResponse(error);
  return createApiResponse(responseData, error.statusCode || 500);
}
