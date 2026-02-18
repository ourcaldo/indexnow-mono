import { supabaseAdmin } from '../server'
import { logger, type Json } from '@indexnow/shared'
import { type PostgrestError } from '@supabase/supabase-js'
import { toJson } from '../utils/json-helpers'

// Table name constant
const AUDIT_TABLE = 'indb_security_audit_logs' as const

/**
 * Isolated interface for the audit log table to avoid recursion issues.
 */
export interface AuditLogTable {
  Row: {
    id: string
    user_id: string | null
    event_type: string
    description: string
    success: boolean | null
    metadata: Json
    created_at: string
  }
  Insert: {
    id?: string
    user_id?: string | null
    event_type: string
    description: string
    success?: boolean | null
    metadata?: Json
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string | null
    event_type?: string
    description?: string
    success?: boolean | null
    metadata?: Json
    created_at?: string
  }
}

/**
 * DECOUPLED INTERFACE: To bypass the recursive depth limits of the full Supabase SDK during DTS generation,
 * we define a structural interface that matches only the subset of the client we need.
 */
interface SimpleAuditClient {
  from: (table: typeof AUDIT_TABLE) => {
    insert: (values: AuditLogTable['Insert']) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string } | null; error: PostgrestError | null }>
      }
    }
    update: (values: AuditLogTable['Update']) => {
      eq: (column: string, value: string) => Promise<{ error: PostgrestError | null }>
    }
  }
  auth: {
    admin: {
      getUserById: (uid: string) => Promise<{ data: { user: { id: string } | null } | null; error: PostgrestError | null }>
    }
  }
}

/**
 * Context for service role operations.
 */
export interface ServiceRoleOperationContext {
  userId: string
  operation: string
  reason: string
  source: string
  metadata?: Record<string, Json>
  ipAddress?: string
  userAgent?: string
}

/**
 * Context for user operations.
 */
export interface UserOperationContext {
  userId: string
  operation: string
  source: string
  reason: string
  metadata?: Record<string, Json>
  ipAddress?: string
  userAgent?: string
}

/**
 * Options for secure queries.
 */
export interface SecureQueryOptions<TTable = string> {
  table: TTable
  operationType: 'select' | 'insert' | 'update' | 'delete'
  columns?: string[]
  whereConditions?: Record<string, Json>
  data?: Json
}

export class SecurityViolationError extends Error {
  constructor(message: string, public details: Record<string, Json>) {
    super(message)
    this.name = 'SecurityViolationError'
  }
}

/**
 * Centralized adapter to obtain a structurally-typed audit client.
 * This cast is safe because supabaseAdmin structurally satisfies SimpleAuditClient.
 * Encapsulating it here avoids scattering `as unknown as` throughout the codebase.
 */
function asAuditClient(): SimpleAuditClient {
  return supabaseAdmin as unknown as SimpleAuditClient
}

export class SecurityService {
  /**
   * Validates that the operation context is complete and authorized.
   */
  static async validateOperationContext(
    context: ServiceRoleOperationContext,
    queryOptions: SecureQueryOptions
  ): Promise<void> {
    if (!context.userId || !context.operation || !context.reason || !context.source) {
      throw new SecurityViolationError(
        'Invalid service role operation context - missing required fields',
        { 
          userId: context.userId,
          operation: context.operation,
          source: context.source,
          table: queryOptions.table,
          operationType: queryOptions.operationType
        }
      )
    }

    if (context.userId !== 'system' && context.userId !== 'anonymous') {
      const { data: authUser, error } = await asAuditClient().auth.admin.getUserById(context.userId)
      if (error || !authUser?.user) {
        throw new SecurityViolationError(
          'Service role operation requested by invalid or non-existent user',
          { userId: context.userId, source: context.source }
        )
      }
    }

    const allowedOperations = ['select', 'insert', 'update', 'delete']
    if (!allowedOperations.includes(queryOptions.operationType)) {
      throw new SecurityViolationError(
        'Invalid service role operation type',
        { operationType: queryOptions.operationType }
      )
    }

    logger.info({
      userId: context.userId,
      operation: context.operation,
      table: queryOptions.table,
      operationType: queryOptions.operationType
    }, 'Service role operation context validated successfully')
  }

  /**
   * Sanitizes user context fields to prevent injection.
   */
  static sanitizeUserContext(context: UserOperationContext): UserOperationContext {
    return {
      userId: context.userId.replace(/[^a-zA-Z0-9-]/g, ''),
      operation: context.operation.replace(/[^a-zA-Z0-9_]/g, ''),
      source: context.source.replace(/[^a-zA-Z0-9/_-]/g, ''),
      reason: context.reason.substring(0, 500),
      metadata: context.metadata ? (this.sanitizeDataObject(context.metadata) as Record<string, Json>) : undefined,
      ipAddress: context.ipAddress?.substring(0, 45),
      userAgent: context.userAgent?.substring(0, 500)
    }
  }

  /**
   * Sanitizes query options to prevent injection.
   */
  static sanitizeQueryOptions(queryOptions: SecureQueryOptions): SecureQueryOptions {
    const sanitized = { ...queryOptions }
    if (queryOptions.columns) {
      sanitized.columns = queryOptions.columns.map(col => col.replace(/[^a-zA-Z0-9_]/g, ''))
    }
    if (queryOptions.data) {
      if (Array.isArray(queryOptions.data)) {
        sanitized.data = queryOptions.data.map(item => this.sanitizeDataObject(item as Record<string, Json | undefined>)) as Json
      } else if (typeof queryOptions.data === 'object' && queryOptions.data !== null) {
        sanitized.data = this.sanitizeDataObject(queryOptions.data as Record<string, Json | undefined>) as Json
      }
    }
    if (queryOptions.whereConditions && typeof queryOptions.whereConditions === 'object') {
      sanitized.whereConditions = this.sanitizeDataObject(queryOptions.whereConditions as Record<string, Json | undefined>) as Record<string, Json>
    }
    return sanitized
  }

  /**
   * Generic sanitizer for data objects.
   * Recursively sanitizes nested objects instead of stringifying them.
   */
  static sanitizeDataObject(data: Record<string, Json | undefined>): Record<string, Json | undefined> {
    const sanitized: Record<string, Json | undefined> = {}
    
    for (const [key, value] of Object.entries(data)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '')
      if (value === undefined) {
        sanitized[cleanKey] = undefined
      } else if (typeof value === 'string') {
        // Only truncate strings — do NOT strip quotes/apostrophes.
        // Supabase uses parameterized queries so SQL injection via values is not possible.
        sanitized[cleanKey] = value.substring(0, 5000)
      } else if (typeof value === 'number') {
        sanitized[cleanKey] = isNaN(value) ? 0 : value
      } else if (typeof value === 'boolean' || value === null) {
        sanitized[cleanKey] = value
      } else if (Array.isArray(value)) {
        sanitized[cleanKey] = value.map(item => {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            return toJson(this.sanitizeDataObject(item as Record<string, Json | undefined>))
          }
          return item
        })
      } else if (typeof value === 'object') {
        sanitized[cleanKey] = toJson(this.sanitizeDataObject(value as Record<string, Json | undefined>))
      } else {
        sanitized[cleanKey] = String(value).substring(0, 1000)
      }
    }
    return sanitized
  }

  /**
   * Logs the start of a service role operation.
   */
  static async logOperationStart(
    context: ServiceRoleOperationContext,
    queryOptions: SecureQueryOptions
  ): Promise<string> {
    try {
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        operation: context.operation,
        reason: context.reason,
        source: context.source,
        table: queryOptions.table,
        operationType: queryOptions.operationType,
        columns: queryOptions.columns ?? [],
        hasData: !!queryOptions.data,
        hasWhereConditions: !!queryOptions.whereConditions,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null
      }

      const { data, error } = await asAuditClient()
        .from(AUDIT_TABLE)
        .insert({
          user_id: context.userId === 'system' ? null : context.userId,
          event_type: 'service_role_operation',
          description: `Service role operation: ${context.operation} on ${queryOptions.table}`,
          success: null,
          metadata: metadata as Json
        })
        .select('id')
        .single()

      if (error || !data) {
        logger.error({ error: error || undefined }, 'Failed to log service role operation start')
        return 'unknown'
      }
      return data.id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMessage }, 'Failed to create service role audit log')
      return 'unknown'
    }
  }

  /**
   * Safely converts any result to a Json compatible format.
   */
  private static sanitizeResult(result: unknown): Json {
    if (result === undefined) return null
    if (result === null) return null
    if (typeof result === 'string') return result.substring(0, 5000)
    if (typeof result === 'number') return isNaN(result) ? 0 : result
    if (typeof result === 'boolean') return result
    
    if (Array.isArray(result)) {
      return result.map(item => this.sanitizeResult(item))
    }
    
    if (typeof result === 'object') {
      const sanitized: Record<string, Json> = {}
      try {
        // Handle simple objects
        for (const [key, value] of Object.entries(result)) {
           sanitized[key] = this.sanitizeResult(value)
        }
        return sanitized
      } catch (e) {
        return { error: 'Failed to sanitize object' }
      }
    }
    
    return String(result).substring(0, 1000)
  }

  /**
   * Logs the success of a service role operation.
   */
  static async logOperationSuccess(
    auditId: string,
    context: ServiceRoleOperationContext,
    result: unknown
  ): Promise<void> {
    if (auditId === 'unknown') return
    try {
      const sanitizedResult = this.sanitizeResult(result)
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        result: sanitizedResult,
        resultType: typeof result,
        resultLength: Array.isArray(result) ? result.length : 1,
        completedAt: new Date().toISOString()
      }

      const { error } = await asAuditClient()
        .from(AUDIT_TABLE)
        .update({
          success: true,
          metadata: metadata as Json
        })
        .eq('id', auditId)

      if (error) throw error
      logger.info({ auditId, operation: context.operation }, 'Service role operation completed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMessage, auditId }, 'Failed to log service role operation success')
    }
  }

  /**
   * Logs the failure of a service role operation.
   */
  static async logOperationFailure(
    auditId: string,
    context: ServiceRoleOperationContext,
    error: Error
  ): Promise<void> {
    if (auditId === 'unknown') return
    try {
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        error: error.message || String(error),
        errorType: error.name || 'Unknown',
        failedAt: new Date().toISOString()
      }

      const { error: updateError } = await asAuditClient()
        .from(AUDIT_TABLE)
        .update({
          success: false,
          metadata: metadata as Json
        })
        .eq('id', auditId)

      if (updateError) throw updateError
      logger.error({ auditId, operation: context.operation, error: error.message }, 'Service role operation failed')
    } catch (logError) {
      const logErrorMessage = logError instanceof Error ? logError.message : String(logError)
      logger.error({ logError: logErrorMessage, auditId, originalError: error.message }, 'Failed to log service role operation failure')
    }
  }

  /**
   * Logs the start of a user operation.
   */
  static async logUserOperationStart(
    context: UserOperationContext,
    queryOptions: SecureQueryOptions
  ): Promise<string> {
    try {
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        operation: context.operation,
        reason: context.reason,
        source: context.source,
        table: queryOptions.table,
        operationType: queryOptions.operationType,
        columns: queryOptions.columns ?? [],
        hasData: !!queryOptions.data,
        hasWhereConditions: !!queryOptions.whereConditions,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null
      }

      const { data, error } = await asAuditClient()
        .from(AUDIT_TABLE)
        .insert({
          user_id: context.userId,
          event_type: 'user_operation',
          description: `User operation: ${context.operation} on ${queryOptions.table}`,
          success: null,
          metadata: metadata as Json
        })
        .select('id')
        .single()

      if (error || !data) {
        logger.error({ error: error || undefined }, 'Failed to log user operation start')
        return 'unknown'
      }
      return data.id
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMessage }, 'Failed to create user operation audit log')
      return 'unknown'
    }
  }

  /**
   * Logs the success of a user operation.
   */
  static async logUserOperationSuccess(
    auditId: string,
    context: UserOperationContext,
    result: unknown
  ): Promise<void> {
    if (auditId === 'unknown') return
    try {
      const sanitizedResult = this.sanitizeResult(result)
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        result: sanitizedResult,
        resultType: typeof result,
        resultLength: Array.isArray(result) ? result.length : 1,
        completedAt: new Date().toISOString()
      }

      const { error } = await asAuditClient()
        .from(AUDIT_TABLE)
        .update({
          success: true,
          metadata: metadata as Json
        })
        .eq('id', auditId)

      if (error) throw error
      logger.info({ auditId, operation: context.operation }, 'User operation completed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMessage, auditId }, 'Failed to log user operation success')
    }
  }

  /**
   * Logs the failure of a user operation.
   */
  static async logUserOperationFailure(
    auditId: string,
    context: UserOperationContext,
    error: Error
  ): Promise<void> {
    if (auditId === 'unknown') return
    try {
      const metadata: Record<string, Json | undefined> = {
        ...(context.metadata || {}),
        error: error.message || String(error),
        errorType: error.name || 'Unknown',
        failedAt: new Date().toISOString()
      }

      const { error: updateError } = await asAuditClient()
        .from(AUDIT_TABLE)
        .update({
          success: false,
          metadata: metadata as Json
        })
        .eq('id', auditId)

      if (updateError) throw updateError
      logger.error({ auditId, operation: context.operation, error: error.message }, 'User operation failed')
    } catch (logError) {
      const logErrorMessage = logError instanceof Error ? logError.message : String(logError)
      logger.error({ logError: logErrorMessage, auditId, originalError: error.message }, 'Failed to log user operation failure')
    }
  }
}
