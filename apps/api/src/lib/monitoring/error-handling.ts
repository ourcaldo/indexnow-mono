import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, SecureServiceRoleHelpers } from '@indexnow/database';
import { trackServerError } from '@indexnow/analytics';
import { ErrorType, ErrorSeverity, type StructuredError, type Json } from '@indexnow/shared';
import { formatError } from '../core/api-response-formatter';

// Re-export shared types that consumers expect from this module
export { ErrorType, ErrorSeverity } from '@indexnow/shared';
export type { StructuredError } from '@indexnow/shared';

// Configure Pino logger — read level from AppConfig
const logLevel = process.env.LOG_LEVEL || 'info';
export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// User-friendly error messages mapping
const USER_ERROR_MESSAGES: Record<ErrorType, Record<string, string>> = {
  [ErrorType.AUTHENTICATION]: {
    default: 'Authentication failed. Please log in again.',
    invalid_credentials: 'Invalid email or password.',
    token_expired: 'Your session has expired. Please log in again.',
    missing_token: 'Please log in to access this feature.'
  },
  [ErrorType.AUTHORIZATION]: {
    default: 'You do not have permission to perform this action.',
    insufficient_permissions: 'Insufficient permissions for this operation.',
    resource_not_found: 'The requested resource was not found.'
  },
  [ErrorType.VALIDATION]: {
    default: 'Please check your input and try again.',
    invalid_format: 'The provided data format is invalid.',
    missing_required: 'Required fields are missing.',
    invalid_email: 'Please provide a valid email address.'
  },
  [ErrorType.DATABASE]: {
    default: 'A database error occurred. Please try again.',
    connection_failed: 'Database connection failed. Please try again later.',
    query_failed: 'Failed to process your request. Please try again.'
  },
  [ErrorType.EXTERNAL_API]: {
    default: 'External service temporarily unavailable. Please try again.',
    quota_exceeded: 'API quota has been exceeded. Please try again later.',
    rate_limited: 'Too many requests. Please wait before trying again.'
  },
  [ErrorType.ENCRYPTION]: {
    default: 'Security processing error. Please try again.',
    decryption_failed: 'Failed to decrypt service account credentials.',
    encryption_failed: 'Failed to encrypt sensitive data.'
  },
  [ErrorType.RATE_LIMIT]: {
    default: 'Too many requests. Please wait before trying again.',
    quota_exceeded: 'Rate limit exceeded. Please try again later.'
  },
  [ErrorType.SYSTEM]: {
    default: 'System error occurred. Please try again.',
    service_unavailable: 'Service temporarily unavailable.',
    maintenance: 'System is under maintenance. Please try again later.'
  },
  [ErrorType.NETWORK]: {
    default: 'Network error occurred. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    connection_failed: 'Connection failed. Please check your network.'
  },
  [ErrorType.BUSINESS_LOGIC]: {
    default: 'Unable to process your request.',
    invalid_operation: 'This operation is not allowed.',
    resource_conflict: 'A conflict occurred with existing data.'
  },
  [ErrorType.NOT_FOUND]: {
    default: 'The requested resource was not found.'
  },
  [ErrorType.INTERNAL]: {
    default: 'An internal error occurred. Please try again later.'
  },
  [ErrorType.PAYMENT]: {
    default: 'A payment processing error occurred. Please try again.'
  }
};

/**
 * Enhanced error handling service
 */
export class ErrorHandlingService {
  /**
   * Create a structured error with automatic logging and database recording
   */
  static async createError(
    type: ErrorType,
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      userId?: string;
      endpoint?: string;
      method?: string;
      statusCode?: number;
      metadata?: Record<string, unknown> | Json;
      userMessageKey?: string;
    } = {}
  ): Promise<StructuredError> {
    const errorId = uuidv4();
    const timestamp = new Date();

    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    // Get user-friendly message
    const userMessage = options.userMessageKey
      ? USER_ERROR_MESSAGES[type][options.userMessageKey] || USER_ERROR_MESSAGES[type].default
      : USER_ERROR_MESSAGES[type].default;

    const structuredError: StructuredError = {
      id: errorId,
      type,
      severity: options.severity || ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage,
      userId: options.userId,
      endpoint: options.endpoint,
      method: options.method,
      statusCode: options.statusCode || 500,
      metadata: options.metadata as Record<string, Json> | undefined,
      stack,
      timestamp
    };

    // Log the error based on severity
    const logContext = {
      errorId,
      type,
      severity: structuredError.severity,
      userId: options.userId,
      endpoint: options.endpoint,
      method: options.method,
      statusCode: structuredError.statusCode,
      metadata: options.metadata
    };

    switch (structuredError.severity) {
      case ErrorSeverity.CRITICAL:
        logger.fatal(logContext, errorMessage);
        break;
      case ErrorSeverity.HIGH:
        logger.error(logContext, errorMessage);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(logContext, errorMessage);
        break;
      case ErrorSeverity.LOW:
        logger.info(logContext, errorMessage);
        break;
    }

    // Record error in database (async, don't block response)
    this.recordErrorInDatabase(structuredError).catch(dbError => {
      logger.error({ errorId, dbError: dbError.message }, 'Failed to record error in database');
    });

    // Also send to Sentry for server-side error tracking
    if (typeof window === 'undefined') {
      try {
        trackServerError(error instanceof Error ? error : new Error(errorMessage), {
          errorId,
          errorType: type,
          severity: structuredError.severity,
          userId: options.userId,
          endpoint: options.endpoint,
          method: options.method,
          statusCode: structuredError.statusCode,
          metadata: options.metadata,
        });
      } catch (sentryError) {
        // Silent fail - analytics should never break the app
      }
    }

    return structuredError;
  }

  /**
   * Record error in database for tracking and analytics using secure service role wrapper
   */
  private static async recordErrorInDatabase(error: StructuredError): Promise<void> {
    try {
      const operationContext = {
        userId: error.userId || 'system',
        operation: 'record_system_error_log',
        reason: 'Recording structured error in database for monitoring and analytics',
        source: 'lib/monitoring/error-handling',
        metadata: {
          errorId: error.id,
          errorType: error.type,
          severity: error.severity,
          endpoint: error.endpoint,
          statusCode: error.statusCode
        } as Record<string, Json>
      };

      await SecureServiceRoleHelpers.secureInsert(
        operationContext,
        'indb_system_error_logs',
        {
          id: error.id,
          user_id: error.userId || null,
          error_type: error.type,
          severity: error.severity,
          message: error.message,
          user_message: error.userMessage,
          endpoint: error.endpoint || null,
          http_method: error.method || null,
          status_code: error.statusCode,
          metadata: error.metadata || null,
          stack_trace: error.stack || null,
          created_at: error.timestamp.toISOString()
        }
      );
    } catch (dbError) {
      // Don't throw here to avoid infinite loop
      logger.error({
        originalErrorId: error.id,
        dbError: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, 'Failed to record error in database');
    }
  }

  /**
   * Create a standardized API error response
   */
  static createErrorResponse(structuredError: StructuredError, requestId?: string) {
    return formatError(structuredError, requestId);
  }

  /**
   * Wrap async functions with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    errorContext: {
      type: ErrorType;
      severity?: ErrorSeverity;
      userId?: string;
      endpoint?: string;
      method?: string;
      userMessageKey?: string;
    }
  ): Promise<{ success: true; data: T } | { success: false; error: StructuredError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const structuredError = await this.createError(
        errorContext.type,
        error as Error,
        errorContext
      );
      return { success: false, error: structuredError };
    }
  }
}

/**
 * HTTP status code utilities
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Determine if an error is a transient service/network error
 */
export function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Record<string, unknown>;
  const errorMessage = typeof err.message === 'string' ? err.message.toLowerCase() : '';
  const errorCode = typeof err.code === 'string' ? err.code.toLowerCase() : '';
  const errorStatus = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 0);

  // Network and connection errors
  const networkErrors = [
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'etimedout',
    'fetch failed',
    'connection',
    'socket',
    'aborted'
  ];

  // Service availability errors
  const serviceErrors = [
    'service unavailable',
    'temporarily unavailable',
    'server error',
    'internal server error',
    'bad gateway',
    'gateway timeout'
  ];

  if (errorStatus >= 500 && errorStatus < 600) {
    return true;
  }

  for (const pattern of networkErrors) {
    if (errorMessage.includes(pattern)) {
      return true;
    }
  }

  for (const pattern of serviceErrors) {
    if (errorMessage.includes(pattern)) {
      return true;
    }
  }

  const transientCodes = ['network_error', 'timeout', 'unavailable', 'server_error'];
  for (const code of transientCodes) {
    if (errorCode.includes(code)) {
      return true;
    }
  }

  return false;
}

/**
 * Common error patterns for consistent responses
 */
export const CommonErrors = {
  UNAUTHORIZED: (userId?: string) => ErrorHandlingService.createError(
    ErrorType.AUTHENTICATION,
    'Authentication required',
    {
      severity: ErrorSeverity.MEDIUM,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      userId,
      userMessageKey: 'missing_token'
    }
  ),

  INVALID_TOKEN: (userId?: string) => ErrorHandlingService.createError(
    ErrorType.AUTHENTICATION,
    'Invalid or expired authentication token',
    {
      severity: ErrorSeverity.MEDIUM,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      userId,
      userMessageKey: 'token_expired'
    }
  ),

  FORBIDDEN: (userId: string, resource?: string) => ErrorHandlingService.createError(
    ErrorType.AUTHORIZATION,
    `Access denied to resource: ${resource || 'unknown'}`,
    {
      severity: ErrorSeverity.HIGH,
      statusCode: HTTP_STATUS.FORBIDDEN,
      userId,
      userMessageKey: 'insufficient_permissions',
      metadata: { resource }
    }
  ),

  VALIDATION_ERROR: (details: string, userId?: string) => ErrorHandlingService.createError(
    ErrorType.VALIDATION,
    `Validation failed: ${details}`,
    {
      severity: ErrorSeverity.LOW,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      userId,
      userMessageKey: 'invalid_format',
      metadata: { validationDetails: details }
    }
  ),

  NOT_FOUND: (resource: string, userId?: string) => ErrorHandlingService.createError(
    ErrorType.NOT_FOUND,
    `Resource not found: ${resource}`,
    {
      severity: ErrorSeverity.MEDIUM,
      statusCode: HTTP_STATUS.NOT_FOUND,
      userId,
      userMessageKey: 'resource_not_found',
      metadata: { resource }
    }
  ),

  DATABASE_ERROR: (operation: string, userId?: string) => ErrorHandlingService.createError(
    ErrorType.DATABASE,
    `Database operation failed: ${operation}`,
    {
      severity: ErrorSeverity.HIGH,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      userId,
      userMessageKey: 'query_failed',
      metadata: { operation }
    }
  ),

  EXTERNAL_API_ERROR: (service: string, details?: string, userId?: string) => ErrorHandlingService.createError(
    ErrorType.EXTERNAL_API,
    `External API error from ${service}: ${details || 'Unknown error'}`,
    {
      severity: ErrorSeverity.HIGH,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      userId,
      userMessageKey: 'default',
      metadata: { service, details }
    }
  ),

  SERVICE_UNAVAILABLE: (service: string, details?: string, userId?: string) => ErrorHandlingService.createError(
    ErrorType.EXTERNAL_API,
    `Service temporarily unavailable: ${service}${details ? ` - ${details}` : ''}`,
    {
      severity: ErrorSeverity.HIGH,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      userId,
      userMessageKey: 'default',
      metadata: { service, details, transient: true }
    }
  )
};
