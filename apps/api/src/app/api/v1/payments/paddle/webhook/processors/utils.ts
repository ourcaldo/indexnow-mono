/**
 * Shared utilities for Paddle webhook processors
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';

export interface CustomData {
  userId?: string;
  packageSlug?: string;
  billingPeriod?: string;
}

// Legacy Paddle gateway UUID removed — gateway ID must be fetched from indb_payment_gateways

export function validateCustomData(customData: unknown, eventId: string): CustomData | null {
  if (!customData || typeof customData !== 'object') {
    logger.warn(
      {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        event_id: eventId,
        custom_data: customData,
      } as Record<string, unknown>,
      `[VALIDATION] Missing or invalid custom_data in webhook event ${eventId}`
    );
    return null;
  }

  const data = customData as Record<string, unknown>;

  if (!data.userId) {
    logger.warn(
      {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        event_id: eventId,
        custom_data: customData,
      } as Record<string, unknown>,
      `[VALIDATION] Missing userId in custom_data for webhook event ${eventId}`
    );
    return null;
  }

  return customData as CustomData;
}

export function safeGet<T>(obj: Record<string, unknown>, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current !== undefined && current !== null ? (current as T) : defaultValue;
}

export async function logProcessorError(
  eventId: string,
  eventType: string,
  error: Error,
  metadata?: Record<string, unknown>
) {
  logger.error(
    {
      type: ErrorType.EXTERNAL_API,
      severity: ErrorSeverity.HIGH,
      event_id: eventId,
      event_type: eventType,
      error_message: error.message,
      error_stack: error.stack,
      ...metadata,
    } as Record<string, unknown>,
    '[PROCESSOR_ERROR]'
  );
}

export async function getPackageIdFromSubscription(
  subscriptionId: string | null,
  customData: CustomData & { packageId?: string }
): Promise<string> {
  if (subscriptionId) {
    const subscription = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system',
        operation: 'lookup_subscription_package',
        reason: 'Resolve package_id from subscription for transaction processing',
        source: 'webhook.processors.utils',
      },
      {
        table: 'indb_payment_subscriptions',
        operationType: 'select',
        columns: ['package_id'],
        whereConditions: { paddle_subscription_id: subscriptionId },
      },
      async () => {
        const { data } = await supabaseAdmin
          .from('indb_payment_subscriptions')
          .select('package_id')
          .eq('paddle_subscription_id', subscriptionId)
          .maybeSingle();
        return data;
      }
    );

    if (subscription?.package_id) {
      return subscription.package_id;
    }
  }

  if (customData.packageId) {
    return customData.packageId;
  }

  if (customData.packageSlug) {
    const pkg = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: 'system',
        operation: 'lookup_package_by_slug',
        reason: 'Resolve package_id from slug for transaction processing',
        source: 'webhook.processors.utils',
      },
      {
        table: 'indb_payment_packages',
        operationType: 'select',
        columns: ['id'],
        whereConditions: { slug: customData.packageSlug },
      },
      async () => {
        const { data } = await supabaseAdmin
          .from('indb_payment_packages')
          .select('id')
          .eq('slug', customData.packageSlug!)
          .is('deleted_at', null)
          .maybeSingle();
        return data;
      }
    );

    if (pkg?.id) {
      return pkg.id;
    }
  }

  throw new Error('Unable to determine package_id for transaction');
}

interface PriceItem {
  price?: {
    billing_cycle?: {
      interval?: string;
    };
  };
}

export function getBillingPeriod(items: PriceItem[]): 'month' | 'year' | null {
  if (!items || items.length === 0) return null;

  const interval = items[0]?.price?.billing_cycle?.interval;
  if (interval === 'month') return 'month';
  if (interval === 'year') return 'year';
  return null;
}

export async function getPaddleGatewayId(): Promise<string> {
  const gateway = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'lookup_paddle_gateway',
      reason: 'Resolve Paddle gateway ID',
      source: 'webhook.processors.utils',
    },
    {
      table: 'indb_payment_gateways',
      operationType: 'select',
      columns: ['id'],
      whereConditions: { slug: 'paddle', is_active: true },
    },
    async () => {
      const { data } = await supabaseAdmin
        .from('indb_payment_gateways')
        .select('id')
        .eq('slug', 'paddle')
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle();
      return data;
    }
  );

  if (!gateway) {
    logger.error(
      {
        type: ErrorType.DATABASE,
        severity: ErrorSeverity.HIGH,
      } as Record<string, unknown>,
      '[PADDLE] Paddle payment gateway not found in database — ensure indb_payment_gateways has an active "paddle" row'
    );
    throw new Error('Paddle payment gateway not found in database');
  }

  return gateway.id;
}
