import { SecureServiceRoleWrapper, UpdateDashboardNotification } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/database'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType, StructuredError } from '@/lib/monitoring/error-handling'

export const POST = authenticatedApiWrapper(async (
  request: NextRequest,
  auth,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    if (!context) {
      throw new Error('Missing context parameters')
    }
    const { id: notificationId } = await context.params

    // Create user's authenticated Supabase client
    const cookieStore = await cookies()
    const userSupabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          }
        }
      }
    )

    // Dismiss the notification using SecureWrapper
    await SecureServiceRoleWrapper.executeWithUserSession<boolean>(
      userSupabaseClient,
      {
        userId: auth.userId,
        operation: 'dismiss_user_notification',
        source: 'notifications/dismiss/[id]',
        reason: 'User dismissing their notification',
        metadata: {
          notificationId,
          endpoint: '/api/v1/notifications/dismiss/[id]',
          method: 'POST'
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_notifications_dashboard', operationType: 'update' },
      async (db) => {
        const { error } = await db
          .from('indb_notifications_dashboard')
          .update({ 
            is_read: true,
            dismissed_at: new Date().toISOString()
          } as UpdateDashboardNotification)
          .eq('id', notificationId)
          .eq('user_id', auth.userId)

        if (error) {
          const dbError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error,
            { statusCode: 500, metadata: { userId: auth.userId, notificationId, operation: 'dismiss_notification' } }
          )
          throw dbError
        }

        return true
      }
    )

    return formatSuccess({
      success: true,
      message: 'Notification dismissed successfully'
    })

  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error) {
      return formatError(error as StructuredError)
    }
    
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { statusCode: 500, endpoint: '/api/v1/notifications/dismiss/[id]' }
    )
    return formatError(structuredError)
  }
})
