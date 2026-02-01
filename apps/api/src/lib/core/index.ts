/**
 * Core module barrel exports for IndexNow Studio
 * Exports all core functionality including API, config, and constants
 */

// API exports
export { 
  VALIDATION_PATTERNS, 
  FIELD_LIMITS, 
  NUMERIC_LIMITS, 
  BaseSchemas, 
  ApiEndpoints, 
  ApiClient, 
  apiClient, 
  ApiErrorHandler, 
  ApplicationError, 
  ErrorType, 
  ErrorSeverity,
  formatSuccess,
  formatError,
  AppConfig,
  isMaintenanceMode
} from '@indexnow/shared';
export type { ApiResponse, SuccessResponse, ErrorResponse } from '@indexnow/shared';

// Configuration exports
export * from './config/DatabaseConfig';
export * from './config/PaymentConfig';

// Legacy exports for backward compatibility
export { queryClient } from './queryClient';

