import { supabaseAdmin } from '../server'
import { type SupabaseClient, type PostgrestError, type User, type AuthError } from '@supabase/supabase-js'
import { type Database, type Json } from '@indexnow/shared'
import { 
  SecurityService, 
  SecurityViolationError, 
  type ServiceRoleOperationContext, 
  type UserOperationContext,
  type SecureQueryOptions
} from './SecurityService'

type PublicTables = Database['public']['Tables']

/**
 * STRUCTURAL DATABASE BUILDER: To bypass the recursive depth limits of the full Supabase SDK during DTS generation,
 * we define a structural interface that matches only the subset of the builder we actually use for generic operations.
 */
interface SimpleDbBuilder<TRow, TInsert, TUpdate> {
  select: (columns?: string) => {
    match: (conditions: Record<string, Json>) => Promise<{ data: TRow[] | null; error: PostgrestError | null }>
  }
  insert: (values: TInsert) => {
    select: () => {
      single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
    }
  }
  update: (values: TUpdate) => {
    match: (conditions: Record<string, Json>) => {
      select: () => Promise<{ data: TRow[] | null; error: PostgrestError | null }>
    }
  }
  delete: () => {
    match: (conditions: Record<string, Json>) => Promise<{ error: PostgrestError | null }>
  }
}

interface SimpleDbClient {
  from: (table: string) => SimpleDbBuilder<Record<string, Json>, Record<string, Json>, Record<string, Json>>
}

/**
 * STRUCTURAL USER CLIENT: A simplified interface for user-provided Supabase clients.
 * This prevents recursion exhaustion by avoiding the full Database generic tree.
 */
interface SimpleUserClient {
  auth: {
    getUser: () => Promise<{ data: { user: User | null }; error: AuthError | null }>
    getSession: () => Promise<{ data: { session: Json | null }; error: AuthError | null }>
    signOut: () => Promise<{ error: AuthError | null }>
    resend: (data: Record<string, Json>) => Promise<{ data: Json; error: AuthError | null }>
  }
  from: (table: string) => SimpleDbBuilder<Record<string, Json>, Record<string, Json>, Record<string, Json>>
}

export class SecureDatabaseHelpers {
  /**
   * Executes a database operation securely with user session validation and auditing.
   */
  static async executeWithUserSession<T>(
    userSupabaseClient: SimpleUserClient,
    operationContext: UserOperationContext,
    queryOptions: SecureQueryOptions,
    operation: (db: SimpleUserClient) => Promise<T>
  ): Promise<T> {
    const { data, error: authError } = await userSupabaseClient.auth.getUser()
    const user = data?.user

    if (authError || !user) {
      throw new SecurityViolationError(
        'Invalid user session for secure operation',
        { authErrorMessage: authError?.message ?? 'No auth error message' }
      )
    }

    if (operationContext.userId !== user.id) {
      throw new SecurityViolationError(
        'User ID mismatch in operation context',
        { contextUserId: operationContext.userId, sessionUserId: user.id }
      )
    }

    const sanitizedContext = SecurityService.sanitizeUserContext(operationContext)
    const sanitizedQueryOptions = SecurityService.sanitizeQueryOptions(queryOptions)
    
    const auditId = await SecurityService.logUserOperationStart(sanitizedContext, sanitizedQueryOptions)
    
    try {
      const result = await operation(userSupabaseClient)
      await SecurityService.logUserOperationSuccess(auditId, sanitizedContext, result as unknown as Json)
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      await SecurityService.logUserOperationFailure(auditId, sanitizedContext, errorObj)
      throw error
    }
  }

  /**
   * Executes a database operation securely with service role context validation and auditing.
   */
  static async executeSecureOperation<T, TTable = string>(
    context: ServiceRoleOperationContext,
    queryOptions: SecureQueryOptions<TTable>,
    operation: () => Promise<T>
  ): Promise<T> {
    await SecurityService.validateOperationContext(context, queryOptions as unknown as SecureQueryOptions<string>)
    const sanitizedQueryOptions = SecurityService.sanitizeQueryOptions(queryOptions as unknown as SecureQueryOptions<string>)
    const auditId = await SecurityService.logOperationStart(context, sanitizedQueryOptions)
    
    try {
      const result = await operation()
      await SecurityService.logOperationSuccess(auditId, context, result as unknown as Json)
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      await SecurityService.logOperationFailure(auditId, context, errorObj)
      throw error
    }
  }

  /**
   * Secure SELECT operation.
   */
  static async secureSelect<TTableName extends keyof PublicTables & string>(
    context: ServiceRoleOperationContext,
    table: TTableName,
    columns: string[],
    whereConditions: Record<string, Json>
  ): Promise<PublicTables[TTableName]['Row'][]> {
    return this.executeSecureOperation<PublicTables[TTableName]['Row'][]>(
      context,
      {
        table,
        operationType: 'select',
        columns,
        whereConditions
      },
      async () => {
        const client = supabaseAdmin as unknown as SimpleDbClient
        const builder = client.from(table) as SimpleDbBuilder<PublicTables[TTableName]['Row'], Record<string, Json>, Record<string, Json>>

        const { data, error } = await builder
          .select(columns.join(', '))
          .match(whereConditions)
        
        if (error) throw error
        return (data || [])
      }
    )
  }

  /**
   * Secure INSERT operation.
   */
  static async secureInsert<TTableName extends keyof PublicTables & string>(
    context: ServiceRoleOperationContext,
    table: TTableName,
    data: PublicTables[TTableName]['Insert']
  ): Promise<PublicTables[TTableName]['Row']> {
    return this.executeSecureOperation<PublicTables[TTableName]['Row']>(
      context,
      {
        table,
        operationType: 'insert',
        data: data as Json
      },
      async () => {
        const client = supabaseAdmin as unknown as SimpleDbClient
        const builder = client.from(table) as SimpleDbBuilder<
          PublicTables[TTableName]['Row'],
          PublicTables[TTableName]['Insert'],
          PublicTables[TTableName]['Update']
        >

        const { data: result, error } = await builder
          .insert(data)
          .select()
          .single()
        
        if (error) throw error
        if (!result) throw new Error('No data returned from insert')
        return result
      }
    )
  }

  /**
   * Secure UPDATE operation.
   */
  static async secureUpdate<TTableName extends keyof PublicTables & string>(
    context: ServiceRoleOperationContext,
    table: TTableName,
    data: PublicTables[TTableName]['Update'],
    whereConditions: Record<string, Json>
  ): Promise<PublicTables[TTableName]['Row'][]> {
    return this.executeSecureOperation<PublicTables[TTableName]['Row'][]>(
      context,
      {
        table,
        operationType: 'update',
        data: data as Json,
        whereConditions
      },
      async () => {
        const client = supabaseAdmin as unknown as SimpleDbClient
        const builder = client.from(table) as SimpleDbBuilder<
          PublicTables[TTableName]['Row'],
          PublicTables[TTableName]['Insert'],
          PublicTables[TTableName]['Update']
        >

        const { data: result, error } = await builder
          .update(data)
          .match(whereConditions)
          .select()
        
        if (error) throw error
        return (result || [])
      }
    )
  }

  /**
   * Secure DELETE operation.
   */
  static async secureDelete<TTableName extends keyof PublicTables & string>(
    context: ServiceRoleOperationContext,
    table: TTableName,
    whereConditions: Record<string, Json>
  ): Promise<void> {
    return this.executeSecureOperation(
      context,
      {
        table,
        operationType: 'delete',
        whereConditions
      },
      async () => {
        const client = supabaseAdmin as unknown as SimpleDbClient
        const builder = client.from(table) as SimpleDbBuilder<Record<string, Json>, Record<string, Json>, Record<string, Json>>

        const { error } = await builder
          .delete()
          .match(whereConditions)
        
        if (error) throw error
      }
    )
  }
}
