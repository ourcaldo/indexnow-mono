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
 * STRUCTURAL DATABASE BUILDER: Extended interface for user-facing route handlers.
 * Includes full Supabase query builder chain methods to support real-world usage patterns.
 */
interface SimpleSelectBuilder<TRow> {
  match: (conditions: Record<string, Json>) => Promise<{ data: TRow[] | null; error: PostgrestError | null }>
  eq: (column: string, value: Json) => SimpleSelectBuilder<TRow> & {
    single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
    order: (column: string, options?: { ascending?: boolean }) => SimpleSelectBuilder<TRow>
    limit: (count: number) => SimpleSelectBuilder<TRow>
  }
  in: (column: string, values: Json[]) => SimpleSelectBuilder<TRow>
  order: (column: string, options?: { ascending?: boolean }) => SimpleSelectBuilder<TRow>
  limit: (count: number) => SimpleSelectBuilder<TRow>
  single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
  gte: (column: string, value: Json) => SimpleSelectBuilder<TRow>
}

interface SimpleUpdateBuilder<TRow> {
  match: (conditions: Record<string, Json>) => {
    select: () => Promise<{ data: TRow[] | null; error: PostgrestError | null }>
  }
  eq: (column: string, value: Json) => {
    select: () => {
      single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
    }
  }
}

interface SimpleDbBuilder<TRow, TInsert, TUpdate> {
  select: (columns?: string, options?: { count?: 'exact'; head?: boolean }) => SimpleSelectBuilder<TRow> & {
    count: number | null
    error: PostgrestError | null
  }
  insert: (values: TInsert) => {
    select: () => {
      single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
    }
  }
  update: (values: TUpdate) => SimpleUpdateBuilder<TRow>
  upsert: (values: TInsert) => {
    select: () => {
      single: () => Promise<{ data: TRow | null; error: PostgrestError | null }>
    }
  }
  delete: () => {
    match: (conditions: Record<string, Json>) => Promise<{ error: PostgrestError | null }>
  }
}

interface SimpleDbClient {
  from: <
    TRow = Record<string, Json>,
    TInsert = Record<string, Json>,
    TUpdate = Record<string, Json>
  >(table: string) => SimpleDbBuilder<TRow, TInsert, TUpdate>
}

/**
 * Centralized adapter to obtain a structurally-typed DB client.
 * All casts are isolated here to avoid scattering `as unknown as` throughout the codebase.
 * This is safe because supabaseAdmin structurally satisfies SimpleDbClient.
 */
function asDbClient(): SimpleDbClient {
  return supabaseAdmin as unknown as SimpleDbClient
}

/**
 * Safely converts a typed object to Json for Supabase column storage.
 * This encapsulates the `as unknown as Json` pattern in one place.
 */
function toJson<T>(value: T): Json {
  return value as unknown as Json
}

/**
 * STRUCTURAL USER CLIENT: Extended interface for user-provided Supabase clients.
 * Includes full auth methods needed for password changes and user operations.
 */
interface SimpleUserClient {
  auth: {
    getUser: () => Promise<{ data: { user: User | null }; error: AuthError | null }>
    getSession: () => Promise<{ data: { session: Json | null }; error: AuthError | null }>
    signOut: () => Promise<{ error: AuthError | null }>
    resend: (data: Record<string, Json>) => Promise<{ data: Json; error: AuthError | null }>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: User | null; session: Json | null }; error: AuthError | null }>
    updateUser: (attributes: { password?: string; email?: string; data?: Record<string, Json> }) => Promise<{ data: { user: User | null }; error: AuthError | null }>
  }
  from: <
    TRow = Record<string, Json>,
    TInsert = Record<string, Json>,
    TUpdate = Record<string, Json>
  >(table: string) => SimpleDbBuilder<TRow, TInsert, TUpdate>
}

export class SecureDatabaseHelpers {
  /**
   * Executes a database operation securely with user session validation and auditing.
   * Accepts any Supabase client that implements the required auth methods.
   */
  static async executeWithUserSession<T>(
    userSupabaseClient: SupabaseClient<Database>,
    operationContext: UserOperationContext,
    queryOptions: SecureQueryOptions,
    operation: (db: SupabaseClient<Database>) => Promise<T>
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
      await SecurityService.logUserOperationSuccess(auditId, sanitizedContext, result)
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
    await SecurityService.validateOperationContext(context, queryOptions as SecureQueryOptions<string>)
    const sanitizedQueryOptions = SecurityService.sanitizeQueryOptions(queryOptions as SecureQueryOptions<string>)
    const auditId = await SecurityService.logOperationStart(context, sanitizedQueryOptions)

    try {
      const result = await operation()
      await SecurityService.logOperationSuccess(auditId, context, result)
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
    return this.executeSecureOperation<PublicTables[TTableName]['Row'][], TTableName>(
      context,
      {
        table,
        operationType: 'select',
        columns,
        whereConditions
      },
      async () => {
        const client = asDbClient()
        const builder = client.from<
          PublicTables[TTableName]['Row'],
          Record<string, Json>,
          Record<string, Json>
        >(table)

        const { data, error } = await builder
          .select(columns.join(', '))
          .match(whereConditions)
          .limit(1000)

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
    return this.executeSecureOperation<PublicTables[TTableName]['Row'], TTableName>(
      context,
      {
        table,
        operationType: 'insert',
        data: toJson(data)
      },
      async () => {
        const client = asDbClient()
        const builder = client.from<
          PublicTables[TTableName]['Row'],
          PublicTables[TTableName]['Insert'],
          PublicTables[TTableName]['Update']
        >(table)

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
    return this.executeSecureOperation<PublicTables[TTableName]['Row'][], TTableName>(
      context,
      {
        table,
        operationType: 'update',
        data: toJson(data),
        whereConditions
      },
      async () => {
        const client = asDbClient()
        const builder = client.from<
          PublicTables[TTableName]['Row'],
          PublicTables[TTableName]['Insert'],
          PublicTables[TTableName]['Update']
        >(table)

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
    return this.executeSecureOperation<void, TTableName>(
      context,
      {
        table,
        operationType: 'delete',
        whereConditions
      },
      async () => {
        const client = asDbClient()
        const builder = client.from(table)

        const { error } = await builder
          .delete()
          .match(whereConditions)

        if (error) throw error
      }
    )
  }
}
