/**
 * Paddle Webhook Handler
 * Receives and processes webhook events from Paddle
 * 
 * Security:
 * - Validates webhook signature using webhook secret from DATABASE
 * - Logs all events to indb_paddle_webhook_events
 * - Routes events to appropriate processors
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity, Json, type Database } from '@indexnow/shared';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { publicApiWrapper } from '@/lib/core/api-response-middleware';
import {
    processSubscriptionCreated,
    processSubscriptionUpdated,
    processSubscriptionCanceled,
    processSubscriptionPaused,
    processSubscriptionResumed,
    processSubscriptionActivated,
    processSubscriptionPastDue,
    processTransactionCompleted,
    processTransactionPaymentFailed,
    processTransactionRefunded,
} from './processors';

const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

// Derived types from Database schema
type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];
type WebhookEventRow = Database['public']['Tables']['indb_paddle_webhook_events']['Row'];

interface GatewayCredentials {
    webhook_secret?: string;
}

interface SignatureVerificationResult {
    valid: boolean;
    error?: string;
}

async function getWebhookSecretFromDatabase(): Promise<string> {
    // Use SecureServiceRoleWrapper for audit trail
    const gateway = await SecureServiceRoleWrapper.executeSecureOperation<Pick<PaymentGatewayRow, 'api_credentials'> | null>(
        {
            userId: 'system',
            operation: 'get_paddle_webhook_secret',
            source: 'paddle/webhook',
            reason: 'System fetching Paddle webhook secret for signature verification',
            metadata: { endpoint: '/api/v1/payments/paddle/webhook' }
        },
        { table: 'indb_payment_gateways', operationType: 'select' },
        async () => {
            const { data, error } = await supabaseAdmin
                .from('indb_payment_gateways')
                .select('api_credentials')
                .eq('slug', 'paddle')
                .eq('is_active', true)
                .is('deleted_at', null)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
    );

    if (!gateway) {
        throw new Error('Paddle gateway not found or not active');
    }

    const credentials = gateway.api_credentials as GatewayCredentials;
    const webhookSecret = credentials?.webhook_secret;

    if (!webhookSecret) {
        throw new Error('PADDLE webhook secret not found in database. Please update indb_payment_gateways.api_credentials with actual webhook_secret.');
    }

    return webhookSecret;
}

export const POST = publicApiWrapper(async (request: NextRequest) => {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('paddle-signature');

        if (!signature) {
            await ErrorHandlingService.createError(
                ErrorType.AUTHORIZATION,
                'Missing Paddle webhook signature',
                {
                    severity: ErrorSeverity.HIGH,
                    statusCode: 401,
                }
            );
            return NextResponse.json(
                { error: 'Missing Paddle signature' },
                { status: 401 }
            );
        }

        const verificationResult = await verifyPaddleSignature(rawBody, signature);

        if (!verificationResult.valid) {
            await ErrorHandlingService.createError(
                ErrorType.AUTHORIZATION,
                `Paddle webhook signature verification failed: ${verificationResult.error}`,
                {
                    severity: ErrorSeverity.HIGH,
                    statusCode: 401,
                    metadata: { error: verificationResult.error }
                }
            );
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const eventData = JSON.parse(rawBody) as { event_id?: string; event_type?: string; data?: unknown };
        const { event_id, event_type, data } = eventData;

        if (!event_id || !event_type) {
            await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Missing event_id or event_type in webhook payload',
                {
                    severity: ErrorSeverity.MEDIUM,
                    statusCode: 400,
                }
            );
            return NextResponse.json(
                { error: 'Invalid webhook payload' },
                { status: 400 }
            );
        }

        // Check for duplicate event using SecureServiceRoleWrapper
        const existingEvent = await SecureServiceRoleWrapper.executeSecureOperation<Pick<WebhookEventRow, 'id' | 'processed'> | null>(
            {
                userId: 'system',
                operation: 'check_duplicate_webhook_event',
                source: 'paddle/webhook',
                reason: 'Checking for duplicate Paddle webhook event',
                metadata: { event_id, event_type }
            },
            { table: 'indb_paddle_webhook_events', operationType: 'select' },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_paddle_webhook_events')
                    .select('id, processed')
                    .eq('event_id', event_id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                return data;
            }
        );

        if (existingEvent) {
            if (existingEvent.processed) {
                return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
            }
        } else {
            // Insert new webhook event using SecureServiceRoleWrapper
            await SecureServiceRoleWrapper.executeSecureOperation<void>(
                {
                    userId: 'system',
                    operation: 'log_webhook_event',
                    source: 'paddle/webhook',
                    reason: 'Logging new Paddle webhook event for processing',
                    metadata: { event_id, event_type }
                },
                { table: 'indb_paddle_webhook_events', operationType: 'insert' },
                async () => {
                    const { error } = await supabaseAdmin
                        .from('indb_paddle_webhook_events')
                        .insert({
                            event_id,
                            event_type,
                            payload: eventData as unknown as Json,
                            processed: false,
                        });

                    if (error) throw new Error(`Failed to log webhook event: ${error.message}`);
                }
            );
        }

        await routeWebhookEvent(event_type, data, event_id);

        // Mark event as processed using SecureServiceRoleWrapper
        await SecureServiceRoleWrapper.executeSecureOperation<void>(
            {
                userId: 'system',
                operation: 'mark_webhook_event_processed',
                source: 'paddle/webhook',
                reason: 'Marking Paddle webhook event as successfully processed',
                metadata: { event_id, event_type }
            },
            { table: 'indb_paddle_webhook_events', operationType: 'update' },
            async () => {
                await supabaseAdmin
                    .from('indb_paddle_webhook_events')
                    .update({ processed: true, processed_at: new Date().toISOString() })
                    .eq('event_id', event_id);
            }
        );

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        await ErrorHandlingService.createError(
            ErrorType.EXTERNAL_API,
            error instanceof Error ? error : new Error('Unknown webhook processing error'),
            {
                severity: ErrorSeverity.HIGH,
                statusCode: 500,
                metadata: { source: 'paddle_webhook' }
            }
        );

        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
});

async function verifyPaddleSignature(rawBody: string, signature: string): Promise<SignatureVerificationResult> {
    // CRITICAL: Load webhook secret from DATABASE (not environment variables)
    const webhookSecret = await getWebhookSecretFromDatabase();

    try {
        const parts = signature.split(';');

        if (parts.length !== 2) {
            return { valid: false, error: 'Invalid signature format' };
        }

        const timestampPart = parts[0].split('=');
        const signaturePart = parts[1].split('=');

        if (timestampPart.length !== 2 || timestampPart[0] !== 'ts' ||
            signaturePart.length !== 2 || signaturePart[0] !== 'h1') {
            return { valid: false, error: 'Invalid signature structure' };
        }

        const timestamp = timestampPart[1];
        const receivedSignature = signaturePart[1];

        if (!timestamp || !receivedSignature) {
            return { valid: false, error: 'Missing timestamp or signature value' };
        }

        if (!/^\d+$/.test(timestamp)) {
            return { valid: false, error: 'Invalid timestamp format' };
        }

        if (!/^[0-9a-fA-F]+$/.test(receivedSignature)) {
            return { valid: false, error: 'Invalid signature hex format' };
        }

        const timestampMs = parseInt(timestamp, 10) * 1000;
        const currentMs = Date.now();
        const timeDiffMs = Math.abs(currentMs - timestampMs);

        if (timeDiffMs > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
            return { valid: false, error: 'Timestamp outside tolerance window (replay attack protection)' };
        }

        const payload = `${timestamp}:${rawBody}`;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        if (receivedSignature.length !== expectedSignature.length) {
            return { valid: false, error: 'Signature length mismatch' };
        }

        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );

        return { valid: isValid, error: isValid ? undefined : 'Signature mismatch' };
    } catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : 'Unknown verification error' };
    }
}

async function routeWebhookEvent(eventType: string, data: unknown, eventId: string) {
    try {
        switch (eventType) {
            case 'subscription.created':
                await processSubscriptionCreated(data);
                break;
            case 'subscription.updated':
                await processSubscriptionUpdated(data);
                break;
            case 'subscription.canceled':
                await processSubscriptionCanceled(data);
                break;
            case 'subscription.paused':
                await processSubscriptionPaused(data);
                break;
            case 'subscription.resumed':
                await processSubscriptionResumed(data);
                break;
            case 'subscription.activated':
                await processSubscriptionActivated(data);
                break;
            case 'subscription.past_due':
                await processSubscriptionPastDue(data);
                break;
            case 'transaction.completed':
                await processTransactionCompleted(data);
                break;
            case 'transaction.payment_failed':
                await processTransactionPaymentFailed(data);
                break;
            case 'transaction.refunded':
                await processTransactionRefunded(data);
                break;
            default:
            // Unknown event type, ignore
        }
    } catch (error) {
        // Log error to webhook event using SecureServiceRoleWrapper
        await SecureServiceRoleWrapper.executeSecureOperation<void>(
            {
                userId: 'system',
                operation: 'log_webhook_processing_error',
                source: 'paddle/webhook',
                reason: 'Recording error that occurred during webhook event processing',
                metadata: { eventId, eventType, error: error instanceof Error ? error.message : 'Unknown error' }
            },
            { table: 'indb_paddle_webhook_events', operationType: 'update' },
            async () => {
                await supabaseAdmin
                    .from('indb_paddle_webhook_events')
                    .update({
                        error_message: error instanceof Error ? error.message : 'Unknown error',
                        retry_count: 0,
                    })
                    .eq('event_id', eventId);
            }
        );

        throw error;
    }
}
