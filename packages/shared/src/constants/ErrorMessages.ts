import { ErrorType } from '../types/common/ErrorTypes';

/**
 * User-friendly error messages mapping
 * Centralized for consistent messaging across API and Frontend
 */
export const USER_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  [ErrorType.AUTHENTICATION]: {
    default: 'Authentication failed. Please log in again.',
    invalid_credentials: 'Invalid email or password.',
    token_expired: 'Your session has expired. Please log in again.',
    missing_token: 'Please log in to access this feature.',
  },
  [ErrorType.AUTHORIZATION]: {
    default: 'You do not have permission to perform this action.',
    insufficient_permissions: 'Insufficient permissions for this operation.',
    resource_not_found: 'The requested resource was not found.',
  },
  [ErrorType.VALIDATION]: {
    default: 'Please check your input and try again.',
    invalid_format: 'The provided data format is invalid.',
    missing_required: 'Required fields are missing.',
    invalid_email: 'Please provide a valid email address.',
  },
  [ErrorType.DATABASE]: {
    default: 'A database error occurred. Please try again.',
    connection_failed: 'Database connection failed. Please try again later.',
    query_failed: 'Failed to process your request. Please try again.',
  },
  [ErrorType.EXTERNAL_API]: {
    default: 'External service temporarily unavailable. Please try again.',
    quota_exceeded: 'API quota has been exceeded. Please try again later.',
    rate_limited: 'Too many requests. Please wait before trying again.',
  },
  [ErrorType.ENCRYPTION]: {
    default: 'Security processing error. Please try again.',
    encryption_failed: 'Failed to encrypt sensitive data.',
  },
  [ErrorType.RATE_LIMIT]: {
    default: 'Too many requests. Please wait before trying again.',
    quota_exceeded: 'Rate limit exceeded. Please try again later.',
  },
  [ErrorType.SYSTEM]: {
    default: 'System error occurred. Please try again.',
    service_unavailable: 'Service temporarily unavailable.',
    maintenance: 'System is under maintenance. Please try again later.',
  },
  [ErrorType.NETWORK]: {
    default: 'Network error occurred. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    connection_failed: 'Connection failed. Please check your network.',
  },
  [ErrorType.BUSINESS_LOGIC]: {
    default: 'Unable to process your request.',
    invalid_operation: 'This operation is not allowed.',
    resource_conflict: 'A conflict occurred with existing data.',
  },
};
