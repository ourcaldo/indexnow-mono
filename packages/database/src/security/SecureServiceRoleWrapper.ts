/**
 * Secure Service Role Wrapper - P0.2 Security Fix
 * 
 * This file now acts as a barrel file for the refactored security and database logic.
 * The logic has been split into:
 * - SecurityService.ts: Core security validation and auditing.
 * - SecureDatabaseHelpers.ts: Secure database operations utilizing the SecurityService.
 */

import { 
  SecurityService, 
  SecurityViolationError,
  type ServiceRoleOperationContext,
  type UserOperationContext,
  type SecureQueryOptions
} from './SecurityService'

import { SecureDatabaseHelpers } from './SecureDatabaseHelpers'

// Export types with original names for backward compatibility
export type { 
  ServiceRoleOperationContext, 
  UserOperationContext,
}

// Map SecureQueryOptions to the old name
export type ServiceRoleQueryOptions = SecureQueryOptions

// Map SecurityViolationError to the old name
export { SecurityViolationError as ServiceRoleSecurityViolationError }

/**
 * Backward compatible wrapper class.
 */
export class SecureServiceRoleWrapper {
  static executeWithUserSession = SecureDatabaseHelpers.executeWithUserSession
  static executeSecureOperation = SecureDatabaseHelpers.executeSecureOperation
  
  // Internal logging methods remain accessible if needed, routed to the new service
  private static sanitizeUserContext = SecurityService.sanitizeUserContext
  private static sanitizeQueryOptions = SecurityService.sanitizeQueryOptions
  private static logOperationStart = SecurityService.logOperationStart
  private static logOperationSuccess = SecurityService.logOperationSuccess
  private static logOperationFailure = SecurityService.logOperationFailure
  private static logUserOperationStart = SecurityService.logUserOperationStart
  private static logUserOperationSuccess = SecurityService.logUserOperationSuccess
  private static logUserOperationFailure = SecurityService.logUserOperationFailure
}

/**
 * Backward compatible helpers class.
 */
export class SecureServiceRoleHelpers {
  static secureSelect = SecureDatabaseHelpers.secureSelect
  static secureInsert = SecureDatabaseHelpers.secureInsert
  static secureUpdate = SecureDatabaseHelpers.secureUpdate
  static secureDelete = SecureDatabaseHelpers.secureDelete
}
