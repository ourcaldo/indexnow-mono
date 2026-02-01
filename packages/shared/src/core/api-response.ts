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
    severity: ErrorSeverity
    timestamp: string
    statusCode: number
    details?: ErrorDetails
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
 */
export function formatError(
  error: {
    id: string;
    type: ErrorType;
    message: string;
    severity: ErrorSeverity;
    timestamp: Date;
    statusCode: number;
    details?: ErrorDetails;
  },
  requestId?: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      id: error.id,
      type: error.type,
      message: error.message,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      statusCode: error.statusCode,
      details: error.details
    },
    requestId
  }
}
