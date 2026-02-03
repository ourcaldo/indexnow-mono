/**
 * API Error Handler for IndexNow Studio
 * Centralized error handling and transformation
 */

import { NextResponse } from 'next/server';
import { ErrorType, ErrorSeverity } from '../../types/common/ErrorTypes';
import { formatError } from '../api-response';
import { type Json } from '../../types/common/Json';
import { logger } from '../../utils/logger';

export interface ApiError {
  id?: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  statusCode: number;
  timestamp?: Date;
  metadata?: Record<string, Json>;
  requestId?: string;
}

export class ApplicationError extends Error {
  public readonly id: string;
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly metadata: Record<string, Json>;

  constructor(error: Omit<ApiError, 'requestId'>) {
    super(error.message);
    this.name = 'ApplicationError';
    this.id = error.id || `err_${Date.now()}`;
    this.type = error.type;
    this.userMessage = error.userMessage;
    this.severity = error.severity;
    this.statusCode = error.statusCode;
    this.timestamp = error.timestamp || new Date();
    this.metadata = error.metadata || {};
  }
}

// Error mapping configuration
const ERROR_MAPPINGS: Record<ErrorType, { statusCode: number; userMessage: string }> = {
  [ErrorType.VALIDATION]: {
    statusCode: 400,
    userMessage: 'Please check your input and try again.',
  },
  [ErrorType.AUTHENTICATION]: {
    statusCode: 401,
    userMessage: 'Please log in to continue.',
  },
  [ErrorType.AUTHORIZATION]: {
    statusCode: 403,
    userMessage: 'You do not have permission to perform this action.',
  },
  [ErrorType.NOT_FOUND]: {
    statusCode: 404,
    userMessage: 'The requested resource was not found.',
  },
  [ErrorType.DATABASE]: {
    statusCode: 500,
    userMessage: 'A database error occurred. Please try again later.',
  },
  [ErrorType.EXTERNAL_API]: {
    statusCode: 502,
    userMessage: 'An external service is currently unavailable. Please try again later.',
  },
  [ErrorType.BUSINESS_LOGIC]: {
    statusCode: 400,
    userMessage: 'Unable to complete the requested operation.',
  },
  [ErrorType.INTERNAL]: {
    statusCode: 500,
    userMessage: 'An unexpected error occurred. Please try again later.',
  },
  [ErrorType.RATE_LIMIT]: {
    statusCode: 429,
    userMessage: 'Too many requests. Please wait before trying again.',
  },
  [ErrorType.SYSTEM]: {
    statusCode: 500,
    userMessage: 'A system error occurred. Please contact support.',
  },
  [ErrorType.NETWORK]: {
    statusCode: 503,
    userMessage: 'A network error occurred. Please check your connection.',
  },
  [ErrorType.PAYMENT]: {
    statusCode: 402,
    userMessage: 'Payment processing failed. Please check your payment method.',
  },
  [ErrorType.ENCRYPTION]: {
    statusCode: 500,
    userMessage: 'A security error occurred during data processing.',
  },
};

export class ApiErrorHandler {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createError(
    type: ErrorType,
    message: string,
    metadata?: Record<string, Json>,
    customUserMessage?: string
  ): ApplicationError {
    const mapping = ERROR_MAPPINGS[type];
    
    return new ApplicationError({
      type,
      message,
      userMessage: customUserMessage || mapping.userMessage,
      severity: this.getSeverityForType(type),
      statusCode: mapping.statusCode,
      metadata: metadata || {},
    });
  }

  static handleError(error: unknown, requestId?: string): NextResponse {
    const reqId = requestId || `req_${Date.now()}`;
    
    // Handle ApplicationError
    if (this.isApplicationError(error)) {
      this.logError(error, reqId);
      const response = formatError(error, reqId);
      return NextResponse.json(response, { status: error.statusCode });
    }

    // Handle standard Error
    if (error instanceof Error) {
      this.logError(error, reqId);
      const response = formatError({
        id: `err_${Date.now()}`,
        type: ErrorType.INTERNAL,
        message: error.message,
        severity: ErrorSeverity.HIGH,
        timestamp: new Date(),
        statusCode: 500
      }, reqId);
      return NextResponse.json(response, { status: 500 });
    }

    // Handle unrecognized error
    const unrecognizedError = {
      id: `err_${Date.now()}`,
      type: ErrorType.INTERNAL,
      message: 'An unrecognized error occurred. Please try again later.',
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date(),
      statusCode: 500
    };
    
    this.logError(error, reqId);
    const response = formatError(unrecognizedError, reqId);

    return NextResponse.json(response, { status: 500 });
  }

  private static isApplicationError(error: unknown): error is ApplicationError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'statusCode' in error &&
      'message' in error
    );
  }

  private static getSeverityForType(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.VALIDATION:
      case ErrorType.NOT_FOUND:
        return ErrorSeverity.LOW;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.BUSINESS_LOGIC:
        return ErrorSeverity.MEDIUM;
      case ErrorType.EXTERNAL_API:
      case ErrorType.RATE_LIMIT:
        return ErrorSeverity.HIGH;
      case ErrorType.DATABASE:
      case ErrorType.INTERNAL:
      case ErrorType.SYSTEM:
      case ErrorType.ENCRYPTION:
        return ErrorSeverity.CRITICAL;
      case ErrorType.PAYMENT:
      case ErrorType.NETWORK:
        return ErrorSeverity.HIGH;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private static logError(error: unknown, requestId: string): void {
    const message = error instanceof Error ? error.message : 'Unrecognized error';
    const errorMetadata = error instanceof Error 
      ? { stack: error.stack }
      : typeof error === 'object' && error !== null
        ? JSON.parse(JSON.stringify(error))
        : { raw: String(error) };

    logger.error({
      requestId,
      error: errorMetadata,
    }, message);
  }

  // Convenience methods for common errors
  static validationError(message: string, metadata?: Record<string, Json>): ApplicationError {
    return this.createError(ErrorType.VALIDATION, message, metadata);
  }

  static authenticationError(message: string = 'Authentication required'): ApplicationError {
    return this.createError(ErrorType.AUTHENTICATION, message);
  }

  static authorizationError(message: string = 'Insufficient permissions'): ApplicationError {
    return this.createError(ErrorType.AUTHORIZATION, message);
  }

  static notFoundError(resource: string = 'Resource'): ApplicationError {
    return this.createError(ErrorType.NOT_FOUND, `${resource} not found`);
  }

  static databaseError(message: string, metadata?: Record<string, Json>): ApplicationError {
    return this.createError(ErrorType.DATABASE, message, metadata);
  }

  static externalApiError(service: string, message?: string): ApplicationError {
    return this.createError(
      ErrorType.EXTERNAL_API,
      `${service} service error: ${message || 'Unrecognized error'}`,
      { service }
    );
  }

  static businessLogicError(message: string, metadata?: Record<string, Json>): ApplicationError {
    return this.createError(ErrorType.BUSINESS_LOGIC, message, metadata);
  }
}
