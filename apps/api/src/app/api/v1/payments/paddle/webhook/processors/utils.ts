/**
 * Shared utilities for Paddle webhook processors
 */

import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

export interface CustomData {
    userId?: string;
    packageSlug?: string;
    billingPeriod?: string;
}

export const PADDLE_GATEWAY_ID = 'e24339a4-ec2c-44f7-a6d5-41836025fd47';

export function validateCustomData(customData: unknown, eventId: string): CustomData | null {
    if (!customData || typeof customData !== 'object') {
        console.warn('[VALIDATION]', {
            type: ErrorType.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: `Missing or invalid custom_data in webhook event ${eventId}`,
            event_id: eventId,
            custom_data: customData,
        });
        return null;
    }

    const data = customData as Record<string, unknown>;

    if (!data.userId) {
        console.warn('[VALIDATION]', {
            type: ErrorType.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: `Missing userId in custom_data for webhook event ${eventId}`,
            event_id: eventId,
            custom_data: customData,
        });
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

    return current !== undefined && current !== null ? current as T : defaultValue;
}

export async function logProcessorError(
    eventId: string,
    eventType: string,
    error: Error,
    metadata?: Record<string, unknown>
) {
    console.error('[PROCESSOR_ERROR]', {
        type: ErrorType.EXTERNAL_API,
        severity: ErrorSeverity.HIGH,
        event_id: eventId,
        event_type: eventType,
        error_message: error.message,
        error_stack: error.stack,
        ...metadata,
    });
}

export async function getPackageIdFromSubscription(
    subscriptionId: string | null,
    customData: CustomData & { packageId?: string }
): Promise<string> {
    if (subscriptionId) {
        const { data: subscription } = await supabaseAdmin
            .from('indb_payment_subscriptions')
            .select('package_id')
            .eq('paddle_subscription_id', subscriptionId)
            .maybeSingle();

        if (subscription?.package_id) {
            return subscription.package_id;
        }
    }

    if (customData.packageId) {
        return customData.packageId;
    }

    if (customData.packageSlug) {
        const { data: pkg } = await supabaseAdmin
            .from('indb_payment_packages')
            .select('id')
            .eq('slug', customData.packageSlug)
            .maybeSingle();

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
    const { data: gateway } = await supabaseAdmin
        .from('indb_payment_gateways')
        .select('id')
        .eq('slug', 'paddle')
        .eq('is_active', true)
        .maybeSingle();

    if (!gateway) {
        return PADDLE_GATEWAY_ID;
    }

    return gateway.id;
}
