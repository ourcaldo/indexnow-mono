import { NextRequest, NextResponse } from 'next/server'
import { formatSuccess, formatError } from './api-response-formatter'
export { formatSuccess, formatError }
import { getServerAuthUser, getServerAdminUser } from '../auth/server-auth'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { AppConfig, ErrorHandlingService } from '@indexnow/shared'
import { ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { type User, type SupabaseClient } from '@supabase/supabase-js'

export interface AuthenticatedContext {
    user: User | null;
    supabase: SupabaseClient;
    [key: string]: unknown;
}

export const authenticatedApiWrapper = <TAuth extends AuthenticatedContext = AuthenticatedContext>(handler: (req: NextRequest, auth: TAuth) => Promise<unknown>) => {
  return async (req: NextRequest) => {
    try {
      const auth = await getServerAuthUser(req)
      if (!auth) {
        return NextResponse.json(
          formatError({
            id: 'auth_required',
            type: ErrorType.AUTHENTICATION,
            message: 'Authentication required',
            severity: ErrorSeverity.LOW,
            timestamp: new Date(),
            statusCode: 401
          }),
          { status: 401 }
        )
      }

      // Create supabase client for the handler
      const supabase = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
          cookies: {
            getAll() {
              const cookieHeader = req.headers.get('cookie')
              if (!cookieHeader) return []
              return cookieHeader.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=')
                return { name, value: decodeURIComponent(value || '') }
              })
            },
            setAll(cookiesToSet) {
              // No-op for API routes usually, or handle response headers if needed
            },
          },
        }
      )

      const context = { ...auth, supabase } as TAuth; 
      // We cast here because TAuth extends AuthenticatedContext, and we constructed it. 
      // But to avoid 'unknown', we can just type it as AuthenticatedContext if TAuth is default.
      // However, getServerAuthUser returns a specific structure. 
      // Let's assume TAuth is compatible.
      
      const result = await handler(req, context)
      if (result instanceof NextResponse) return result
      return NextResponse.json(result)
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'API Middleware' });
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      return NextResponse.json(
        formatError({
          id: 'internal_error',
          type: ErrorType.SYSTEM,
          message: errorMessage,
          severity: ErrorSeverity.HIGH,
          timestamp: new Date(),
          statusCode: statusCode
        }),
        { status: statusCode }
      )
    }
  }
}

export const adminApiWrapper = <TAuth extends AuthenticatedContext = AuthenticatedContext>(handler: (req: NextRequest, auth: TAuth) => Promise<unknown>) => {
  return async (req: NextRequest) => {
    try {
      const auth = await getServerAdminUser(req)
      if (!auth || !auth.isAdmin) {
        return NextResponse.json(
          formatError({
            id: 'admin_required',
            type: ErrorType.AUTHORIZATION,
            message: 'Admin access required',
            severity: ErrorSeverity.MEDIUM,
            timestamp: new Date(),
            statusCode: 403
          }),
          { status: 403 }
        )
      }

      // Create supabase client for the handler
      const supabase = createServerClient(
        AppConfig.supabase.url,
        AppConfig.supabase.anonKey,
        {
          cookies: {
            getAll() {
              const cookieHeader = req.headers.get('cookie')
              if (!cookieHeader) return []
              return cookieHeader.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=')
                return { name, value: decodeURIComponent(value || '') }
              })
            },
            setAll(cookiesToSet) {
              // No-op
            },
          },
        }
      )

      const context = { ...auth, supabase } as TAuth;
      const result = await handler(req, context)
      if (result instanceof NextResponse) return result
      return NextResponse.json(result)
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'Admin API Middleware' });
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      return NextResponse.json(
        formatError({
          id: 'admin_internal_error',
          type: ErrorType.SYSTEM,
          message: errorMessage,
          severity: ErrorSeverity.HIGH,
          timestamp: new Date(),
          statusCode: statusCode
        }),
        { status: statusCode }
      )
    }
  }
}

export const publicApiWrapper = (handler: (req: NextRequest) => Promise<unknown>) => {
  return async (req: NextRequest) => {
    try {
      const result = await handler(req)
      if (result instanceof NextResponse) return result
      return NextResponse.json(result)
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'Public API Middleware' });
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      return NextResponse.json(
        formatError({
          id: 'public_internal_error',
          type: ErrorType.SYSTEM,
          message: errorMessage,
          severity: ErrorSeverity.HIGH,
          timestamp: new Date(),
          statusCode: statusCode
        }),
        { status: statusCode }
      )
    }
  }
}

// Additional helpers mentioned in migration-examples.ts
export const createSuccessResponse = (data: unknown, statusCode: number = 200) => {
  return formatSuccess(data, undefined, statusCode)
}

export const createStandardError = (type: ErrorType, error: Error | string, statusCode: number = 500, severity: ErrorSeverity = ErrorSeverity.MEDIUM, details?: unknown) => {
  return formatError({
    id: 'standard_error',
    type,
    message: typeof error === 'string' ? error : error.message,
    severity,
    timestamp: new Date(),
    statusCode,
    details
  })
}

export const withDatabaseOperation = async (fn: () => Promise<unknown>, context: Record<string, unknown>) => {
  try {
    const data = await fn()
    return formatSuccess(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database operation failed';
    return formatError({
      id: 'db_operation_error',
      type: ErrorType.DATABASE,
      message: errorMessage,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      statusCode: 500,
      details: context
    })
  }
}
