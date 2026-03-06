/**
 * Paddle Subscription Cancel API
 * Allows authenticated users to cancel their subscription
 *
 * Auto-applies 7-day refund policy:
 * - ≤7 days from purchase: Full refund + immediate cancellation
 * - >7 days: No refund + scheduled cancellation (access until period end)
 *
 * Uses cancel_subscription_service RPC for atomic dual-write
 * (subscription table + user profile in one transaction).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database, type Json, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';

// Derived types from Database schema
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];

// Selected subscription fields for fetch
type SubscriptionFetch = Pick<
  PaymentSubscriptionRow,
  'user_id' | 'created_at' | 'current_period_end'
>;

const cancelRequestSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  const body = await request.json();

  const validationResult = cancelRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const error = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      validationResult.error.errors[0].message,
      { severity: ErrorSeverity.LOW, statusCode: 400 }
    );
    return formatError(error);
  }

  const { subscriptionId } = validationResult.data;

  // Fetch subscription to verify ownership and calculate refund eligibility
  const subscription =
    await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionFetch | null>(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'fetch_subscription_for_cancellation',
        source: 'paddle/subscription/cancel',
        reason: 'User attempting to cancel subscription - ownership verification',
        metadata: { subscriptionId, endpoint: '/api/v1/payments/paddle/subscription/cancel' },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_payment_subscriptions', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_subscriptions')
          .select('user_id, created_at, current_period_end')
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
      'You do not have permission to cancel this subscription',
      { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
    );
    return formatError(error);
  }

  // Calculate days since subscription creation
  const createdAt = new Date(subscription.created_at);
  const now = new Date();
  const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const refundEligible = daysActive <= 7;

  const canceledAt = new Date().toISOString();
  const subscriptionEndDate = refundEligible ? canceledAt : (subscription.current_period_end ?? canceledAt);

  // Atomic cancel: updates both subscription + user profile in one DB transaction
  const updatedSub = await SecureServiceRoleWrapper.executeWithUserSession<Json>(
    asTypedClient(auth.supabase),
    {
      userId: auth.userId,
      operation: 'cancel_subscription_atomic',
      source: 'paddle/subscription/cancel',
      reason: refundEligible
        ? 'User canceling subscription with refund (within 7 days)'
        : 'User canceling subscription (past 7 day window)',
      metadata: {
        subscriptionId,
        daysActive,
        refundEligible,
        endpoint: '/api/v1/payments/paddle/subscription/cancel',
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    },
    { table: 'indb_payment_subscriptions', operationType: 'update' },
    async (db) => {
      const { data, error } = await db.rpc('cancel_subscription_service', {
        p_paddle_subscription_id: subscriptionId,
        p_user_id: auth.userId,
        p_refund_eligible: refundEligible,
        p_canceled_at: canceledAt,
        p_subscription_end_date: subscriptionEndDate,
      });

      if (error) throw new Error(`Failed to cancel subscription: ${error.message}`);

      return data;
    }
  );

  try {
    await ActivityLogger.logActivity({
      userId: auth.userId,
      eventType: 'subscription_cancel',
      actionDescription: refundEligible ? 'Canceled subscription with refund' : 'Scheduled subscription cancellation',
      targetType: 'subscription',
      request,
      metadata: { subscriptionId, refundEligible, daysActive },
    });
  } catch (_) { /* non-critical */ }

  return formatSuccess({
    action: refundEligible ? 'immediate_cancellation' : 'scheduled_cancellation',
    daysActive,
    refundEligible,
    subscription: updatedSub,
    refund: refundEligible ? { status: 'pending', message: 'Refund will be processed' } : null,
    message: refundEligible
      ? 'Subscription canceled with refund'
      : 'Subscription will be canceled at the end of the billing period',
  });
});
