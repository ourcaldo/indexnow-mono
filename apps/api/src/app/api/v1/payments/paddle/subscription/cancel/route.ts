/**
 * Paddle Subscription Cancel API
 * Allows authenticated users to cancel their subscription via Paddle.
 *
 * Calls Paddle's Cancel Subscription API with effective_from: "next_billing_period".
 * The subscription stays active until the current billing period ends.
 * Paddle sends a subscription.canceled webhook when the cancellation takes effect.
 *
 * Local DB is updated immediately after Paddle confirms the scheduled cancellation.
 * The webhook processor acts as a backup to ensure consistency.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin, SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Database } from '@indexnow/shared';
import { buildOperationContext } from '@/lib/services/build-operation-context';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { cancelPaddleSubscription } from '@/lib/paddle/paddle-api-client';

type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];

type SubscriptionForCancel = Pick<
  PaymentSubscriptionRow,
  'user_id' | 'paddle_subscription_id' | 'status'
>;

const cancelRequestSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  // Guard: PADDLE_API_KEY must be configured
  if (!process.env.PADDLE_API_KEY) {
    const error = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      'Subscription cancellation is not available — payment gateway not configured',
      { severity: ErrorSeverity.MEDIUM, statusCode: 503 }
    );
    return formatError(error);
  }

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

  // Verify ownership and subscription status
  const subscription =
    await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionForCancel | null>(
      asTypedClient(auth.supabase),
      buildOperationContext(request, auth.userId, {
        operation: 'verify_subscription_ownership_for_cancel',
        source: 'paddle/subscription/cancel',
        reason: 'User attempting to cancel subscription — ownership verification',
        metadata: { subscriptionId },
      }),
      { table: 'indb_payment_subscriptions', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_subscriptions')
          .select('user_id, paddle_subscription_id, status')
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

  // Only active subscriptions can be cancelled
  if (subscription.status !== 'active') {
    const error = await ErrorHandlingService.createError(
      ErrorType.BUSINESS_LOGIC,
      `Cannot cancel subscription with status "${subscription.status}". Only active subscriptions can be cancelled.`,
      { severity: ErrorSeverity.LOW, statusCode: 409, userId: auth.userId }
    );
    return formatError(error);
  }

  // Call Paddle Cancel API — wait for confirmed response before touching DB
  logger.info(
    { userId: auth.userId, subscriptionId },
    'User requesting subscription cancellation'
  );

  const result = await cancelPaddleSubscription(subscriptionId, 'next_billing_period');

  if (!result.ok) {
    const statusCode = result.status === 404 ? 404 : result.status >= 500 ? 502 : 400;

    const error = await ErrorHandlingService.createError(
      ErrorType.EXTERNAL_API,
      `Paddle subscription cancel failed: ${result.error.detail}`,
      {
        severity: ErrorSeverity.MEDIUM,
        statusCode,
        userId: auth.userId,
        metadata: {
          paddleErrorCode: result.error.code,
          paddleRequestId: result.requestId,
        },
      }
    );
    return formatError(error);
  }

  // Paddle confirmed — update local DB immediately
  const paddleSub = result.data.data;
  const scheduledChange = paddleSub.scheduled_change;
  const periodEnd = paddleSub.current_billing_period?.ends_at ?? null;

  try {
    await SecureServiceRoleWrapper.executeSecureOperation(
      buildOperationContext(request, 'system', {
        operation: 'update_subscription_after_cancel',
        reason: 'Immediate DB update after successful Paddle cancel request',
        source: 'paddle/subscription/cancel',
        metadata: {
          subscriptionId,
          paddleStatus: paddleSub.status,
          scheduledChange: scheduledChange ?? null,
        },
      }),
      {
        table: 'indb_payment_subscriptions',
        operationType: 'update',
        data: { cancel_at_period_end: true },
        whereConditions: { paddle_subscription_id: subscriptionId },
      },
      async () => {
        await supabaseAdmin
          .from('indb_payment_subscriptions')
          .update({
            cancel_at_period_end: true,
            canceled_at: new Date().toISOString(),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('paddle_subscription_id', subscriptionId);

        const profileUpdate: Record<string, string | null> = {
          subscription_end_date: periodEnd,
        };

        // Backfill paddle_customer_id if missing on profile
        if (paddleSub.customer_id) {
          const { data: profile } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('paddle_customer_id')
            .eq('user_id', auth.userId)
            .single();

          if (!profile?.paddle_customer_id) {
            profileUpdate.paddle_customer_id = paddleSub.customer_id;
          }
        }

        await supabaseAdmin
          .from('indb_auth_user_profiles')
          .update(profileUpdate)
          .eq('user_id', auth.userId);

        logger.info(
          { userId: auth.userId, subscriptionId, periodEnd },
          'Updated local DB after Paddle cancel confirmation'
        );
      }
    );
  } catch (dbErr) {
    // Non-fatal — webhook will handle it as backup
    logger.warn({ error: dbErr }, 'Failed to update local DB after cancel — webhook will handle it');
  }

  // Log activity
  try {
    await ActivityLogger.logActivity({
      userId: auth.userId,
      eventType: 'subscription_cancel',
      actionDescription: 'Scheduled subscription cancellation at end of billing period',
      targetType: 'subscription',
      request,
      metadata: {
        subscriptionId,
        effectiveAt: scheduledChange?.effective_at ?? periodEnd,
      },
    });
  } catch (logErr) {
    logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
  }

  return formatSuccess({
    subscription: {
      id: paddleSub.id,
      status: paddleSub.status,
      canceledAt: paddleSub.canceled_at ?? null,
      scheduledChange: scheduledChange
        ? { action: scheduledChange.action, effectiveAt: scheduledChange.effective_at }
        : null,
      currentBillingPeriod: paddleSub.current_billing_period ?? null,
    },
    message: 'Subscription will be cancelled at the end of the current billing period.',
  });
});
