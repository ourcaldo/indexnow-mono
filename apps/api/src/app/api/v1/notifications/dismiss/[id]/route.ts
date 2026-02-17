import { SecureServiceRoleWrapper, UpdateDashboardNotification, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { ErrorType, type StructuredError , getClientIP} from '@indexnow/shared';
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService } from '@/lib/monitoring/error-handling'

export const POST = authenticatedApiWrapper(async (
  request: NextRequest,
  auth,
  context?: { params: Promise<Record<string, string>> }
) => {
  try {
    if (!context) {
      throw new Error('Missing context parameters')
    }
    const params = await context.params
    const notificationId = params.id

    // Dismiss the notification using SecureWrapper
    await SecureServiceRoleWrapper.executeWithUserSession<boolean>(
      auth.supabase,
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
        ipAddress: getClientIP(request) ?? undefined,
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
    if (error && typeof error === 'object' && 'type' in error && 'statusCode' in error) {
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
