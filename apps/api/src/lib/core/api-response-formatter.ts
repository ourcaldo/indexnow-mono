import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { StructuredError } from '@indexnow/shared';

/**
 * Standardized API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
  statusCode?: number;
}

/**
 * Standardized API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    id: string;
    type: ErrorType;
    message: string;
    severity: ErrorSeverity;
    timestamp: string;
    statusCode: number;
  };
  requestId?: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Format a successful API response
 * @param data - The response data
 * @param requestId - Optional request ID for tracking
 * @param statusCode - Optional HTTP status code (default: 200)
 * @returns Formatted success response object
 */
export function formatSuccess<T>(data: T, requestId?: string, statusCode?: number): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
    ...(statusCode && { statusCode })
  };
}

/**
 * Format an error API response from a StructuredError
 * @param error - The structured error object
 * @param requestId - Optional request ID for tracking
 * @returns Formatted error response object
 */
export function formatError(error: StructuredError, requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      id: error.id,
      type: error.type,
      message: error.userMessage || error.message,
      severity: error.severity,
      timestamp: error.timestamp instanceof Date ? error.timestamp.toISOString() : new Date().toISOString(),
      statusCode: error.statusCode
    },
    requestId
  };
}
