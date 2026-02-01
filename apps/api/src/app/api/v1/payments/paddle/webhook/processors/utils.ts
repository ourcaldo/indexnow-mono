/**
 * Shared utilities for Paddle webhook processors
 */

import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { supabaseAdmin } from '@/lib/database'
import { type Json } from '@indexnow/shared'

export interface CustomData {
  userId?: string
  packageSlug?: string
  billingPeriod?: string
  packageId?: string
}

export interface PaddleWebhookData {
  id: string
  current_billing_period?: {
    starts_at: string
    ends_at: string
  }
  custom_data?: CustomData
  items?: Array<{
    price?: {
      billing_cycle?: {
        interval: string
      }
    }
  }>
  [key: string]: Json | undefined
}

export const PADDLE_GATEWAY_ID = 'e24339a4-ec2c-44f7-a6d5-41836025fd47'

export function validateCustomData(customData: unknown, eventId: string): CustomData | null {
  if (!customData || typeof customData !== 'object') {
    ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      `Missing or invalid custom_data in webhook event ${eventId}`,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { event_id: eventId, custom_data: customData as Json },
      }
    )
    return null
  }

  const data = customData as Record<string, unknown>

  if (!data.userId) {
    ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      `Missing userId in custom_data for webhook event ${eventId}`,
      {
        severity: ErrorSeverity.MEDIUM,
        metadata: { event_id: eventId, custom_data: data as Json },
      }
    )
    return null
  }

  return data as unknown as CustomData
}

export function safeGet<T = Json>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split('.')
  let current: any = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue
    }
    current = current[key]
  }

  return current !== undefined && current !== null ? (current as T) : defaultValue
}

export async function logProcessorError(
  eventId: string,
  eventType: string,
  error: Error,
  metadata?: Record<string, Json>
) {
  await ErrorHandlingService.createError(
    ErrorType.EXTERNAL_API,
    `Paddle webhook processor error for ${eventType}`,
    {
      severity: ErrorSeverity.HIGH,
      metadata: {
        event_id: eventId,
        event_type: eventType,
        error_message: error.message,
        error_stack: error.stack,
        ...metadata,
      },
    }
  )
}

export async function getPackageIdFromSubscription(
  subscriptionId: string | null,
  customData: CustomData
): Promise<string> {
  if (subscriptionId) {
    const { data: subscription } = await supabaseAdmin
      .from('indb_payment_subscriptions')
      .select('package_id')
      .eq('paddle_subscription_id', subscriptionId)
      .maybeSingle()
    
    if (subscription?.package_id) {
      return subscription.package_id
    }
  }
  
  if (customData?.packageId) {
    return customData.packageId
  }
  
  if (customData?.packageSlug) {
    const { data: pkg } = await supabaseAdmin
      .from('indb_payment_packages')
      .select('id')
      .eq('slug', customData.packageSlug)
      .maybeSingle()
    
    if (pkg?.id) {
      return pkg.id
    }
  }
  
  throw new Error('Unable to determine package_id for transaction')
}

export function getBillingPeriod(items: Array<Record<string, unknown>>): 'month' | 'year' | null {
  if (!items || items.length === 0) return null
  
  const price = items[0]?.price as Record<string, unknown>
  const billing_cycle = price?.billing_cycle as Record<string, unknown>
  const interval = billing_cycle?.interval as string
  if (interval === 'month') return 'month'
  if (interval === 'year') return 'year'
  return null
}

export async function getPaddleGatewayId(): Promise<string> {
  const { data: gateway } = await supabaseAdmin
    .from('indb_payment_gateways')
    .select('id')
    .eq('slug', 'paddle')
    .eq('is_active', true)
    .maybeSingle()
  
  if (!gateway) {
    return PADDLE_GATEWAY_ID
  }
  
  return gateway.id
}
