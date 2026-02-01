import { SecureServiceRoleWrapper } from '@indexnow/database';
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AppConfig } from '@indexnow/shared'
import { BasePaymentHandler, PaymentData } from '../channels/shared/base-handler'
import { authenticatedApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import type { AuthenticatedRequest } from '@/lib/core/api-middleware'

// TODO: Import Paddle handler when implemented
// import PaddlePaymentHandler from '../channels/paddle/handler'

interface PaymentTrialProfile {
  has_used_trial: boolean;
  trial_used_at: string | null;
}

export const POST = authenticatedApiWrapper(async (request, auth) => {
  // Parse request body
  const body = await request.json()
  const { payment_method, package_id, billing_period, customer_info, is_trial } = body

  // Check trial eligibility if this is a trial flow
  if (is_trial) {
    const cookieStore2 = await cookies()
    const supabase2 = createServerClient(
      AppConfig.supabase.url,
      AppConfig.supabase.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore2.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none'; } }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore2.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // Check if user has already used trial using SecureWrapper
    const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<PaymentTrialProfile>(
      supabase2,
      {
        userId: auth.userId,
        operation: 'check_trial_eligibility',
        source: 'billing/payment',
        reason: 'Checking if user has already used trial before payment',
        metadata: { package_id, payment_method, billing_period }
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('has_used_trial, trial_used_at')
          .eq('user_id', auth.userId)
          .single()
        
        if (error) throw error
        return data as PaymentTrialProfile
      }
    )

    if (userProfile?.has_used_trial) {
      const error = await ErrorHandlingService.createError(
        ErrorType.BUSINESS_LOGIC,
        `Free trial already used on ${new Date(userProfile.trial_used_at || '').toLocaleDateString()}`,
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 400,
          userId: auth.userId,
          userMessageKey: 'default'
        }
      )
      return formatError(error)
    }
  }

  // Prepare payment data
  const paymentData: PaymentData = {
    package_id,
    billing_period,
    customer_info,
    user: auth.user,
    is_trial
  }

  // Route to specific payment channel handler
  // Note: Midtrans and Bank Transfer payment methods have been removed
  // TODO: Implement Paddle payment handler
  
  const error = await ErrorHandlingService.createError(
    ErrorType.VALIDATION,
    'Payment processing is currently unavailable. Paddle integration pending.',
    {
      severity: ErrorSeverity.MEDIUM,
      statusCode: 503,
      userId: auth.userId,
      userMessageKey: 'default',
      metadata: {
        requestedMethod: payment_method,
        note: 'Legacy payment methods (Midtrans/Bank Transfer) removed. Paddle integration in progress.'
      }
    }
  )
  return formatError(error)
  
  // Future Paddle implementation:
  // let handler: BasePaymentHandler
  // switch (payment_method) {
  //   case 'paddle':
  //     handler = new PaddlePaymentHandler(paymentData)
  //     break
  //   default:
  //     return formatError(await ErrorHandlingService.createError(...))
  // }

  // TODO: Uncomment when Paddle handler is implemented
  // try {
  //   const result = await handler.execute()
  //   return result
  // } catch (error) {
  //   const structuredError = await ErrorHandlingService.createError(
  //     ErrorType.EXTERNAL_API,
  //     error instanceof Error ? error : new Error(String(error)),
  //     {
  //       severity: ErrorSeverity.HIGH,
  //       statusCode: 500,
  //       userId: auth.userId,
  //       userMessageKey: 'default'
  //     }
  //   )
  //   return formatError(structuredError)
  // }
})

