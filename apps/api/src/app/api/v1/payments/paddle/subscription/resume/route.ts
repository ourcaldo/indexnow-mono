/**
 * Paddle Subscription Resume API
 * Allows authenticated users to resume their paused subscription
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type SubscriptionOwnerCheck = Pick<PaymentSubscriptionRow, 'user_id' | 'paddle_subscription_id'>;

const resumeRequestSchema = z.object({
    subscriptionId: z.string().min(1, 'Subscription ID is required'),
    effectiveFrom: z.enum(['immediately', 'next_billing_period']).optional().default('immediately'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    const body = await request.json();

    const validationResult = resumeRequestSchema.safeParse(body);
    if (!validationResult.success) {
        const error = await ErrorHandlingService.createError(
            ErrorType.VALIDATION,
            validationResult.error.errors[0].message,
            { severity: ErrorSeverity.LOW, statusCode: 400 }
        );
        return formatError(error);
    }

    const { subscriptionId } = validationResult.data;

    // Verify ownership
    const subscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionOwnerCheck | null>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'verify_subscription_ownership_for_resume',
            source: 'paddle/subscription/resume',
            reason: 'User attempting to resume subscription - ownership verification',
            metadata: { subscriptionId, endpoint: '/api/v1/payments/paddle/subscription/resume' },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'select' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .select('user_id, paddle_subscription_id')
                .eq('paddle_subscription_id', subscriptionId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }
    );

    if (!subscription) {
        const error = await ErrorHandlingService.createError(
            ErrorType.BUSINESS_LOGIC,
            'Subscription not found',
            { severity: ErrorSeverity.LOW, statusCode: 404, userId: auth.userId }
        );
        return formatError(error);
    }

    if (subscription.user_id !== auth.userId) {
        const error = await ErrorHandlingService.createError(
            ErrorType.AUTHORIZATION,
            'You do not have permission to resume this subscription',
            { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
        );
        return formatError(error);
    }

    // Resume the subscription
    const updatedAt = new Date().toISOString();
    const updatedSub = await SecureServiceRoleWrapper.executeWithUserSession<PaymentSubscriptionRow>(
        auth.supabase,
        {
            userId: auth.userId,
            operation: 'resume_subscription',
            source: 'paddle/subscription/resume',
            reason: 'User resuming their paused subscription',
            metadata: { subscriptionId, endpoint: '/api/v1/payments/paddle/subscription/resume' },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') ?? undefined
        },
        { table: 'indb_payment_subscriptions', operationType: 'update' },
        async (db) => {
            const { data, error } = await db
                .from('indb_payment_subscriptions')
                .update({
                    status: 'active',
                    paused_at: null,
                    updated_at: updatedAt
                })
                .eq('paddle_subscription_id', subscriptionId)
                .select()
                .single();

            if (error) throw new Error(`Failed to resume subscription: ${error.message}`);
            return data;
        }
    );

    return formatSuccess({
        subscription: updatedSub,
        message: 'Subscription resumed successfully',
    });
});
