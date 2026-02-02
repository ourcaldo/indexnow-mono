/**
 * Standardized API Response Utilities
 * Provides consistent formatting for all API responses
 */

import { ErrorType, ErrorSeverity } from '../types/common/ErrorTypes'
import { type Json } from '../types/common/Json'

/**
 * Standardized API Error Details
 */
export interface ErrorDetails {
  message?: string
  stack?: string
  metadata?: Record<string, Json>
  validationErrors?: Array<{
    path: string
    message: string
  }>
  [key: string]: Json | undefined
}

/**
 * Standardized API Success Response
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
  requestId?: string
  statusCode?: number
}

/**
 * Standardized API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    id: string
    type: ErrorType
    message: string
    userMessage?: string
    severity: ErrorSeverity
    timestamp: string
    statusCode: number
    details?: Omit<ErrorDetails, 'stack' | 'message'>
  }
  requestId?: string
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = Json> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Format a successful API response
 */
export function formatSuccess<T>(data: T, requestId?: string, statusCode: number = 200): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
    statusCode
  }
}

/**
 * Format an error API response
 * Sanitize the error to prevent internal data leakage in production
 */
export function formatError(
  error: {
    id: string;
    type: ErrorType;
    message: string;
    userMessage?: string;
    severity: ErrorSeverity;
    timestamp: Date;
    statusCode: number;
    details?: ErrorDetails;
  },
  requestId?: string
): ApiErrorResponse {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Use user-friendly message as the primary message in production
  const clientMessage = isProd ? (error.userMessage || 'An unexpected error occurred') : error.message;

  // Strip sensitive details in production
  const sanitizedDetails = error.details ? { ...error.details } : undefined;
  if (isProd && sanitizedDetails) {
    delete sanitizedDetails.stack;
    delete sanitizedDetails.message;
    // Also remove any metadata that might contain sensitive internal info
    if (sanitizedDetails.metadata) {
      delete sanitizedDetails.metadata;
    }
  }

  return {
    success: false,
    error: {
      id: error.id,
      type: error.type,
      message: clientMessage,
      userMessage: error.userMessage,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      statusCode: error.statusCode,
      details: sanitizedDetails
    },
    requestId
  }
}
