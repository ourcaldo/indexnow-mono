import { ErrorType, ErrorSeverity, type StructuredError } from '@indexnow/shared';
import {
  formatSuccess as sharedFormatSuccess,
  type ApiSuccessResponse as SharedApiSuccessResponse,
} from '@indexnow/shared';

/**
 * Re-export the shared formatSuccess — single source of truth
 */
export const formatSuccess = sharedFormatSuccess;

/**
 * Re-export shared success response type
 */
export type ApiSuccessResponse<T = unknown> = SharedApiSuccessResponse<T>;

/**
 * Standardized API Error Response (API-specific — tailored to StructuredError)
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
 * Format an error API response from a StructuredError
 * This is API-specific: the shared package formatError has a different parameter shape.
 * @param error - The structured error object from ErrorHandlingService.createError()
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
