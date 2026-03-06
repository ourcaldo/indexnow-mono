/**
 * Paddle Subscription Update API
 * Allows authenticated users to upgrade/downgrade their subscription plan.
 *
 * Calls Paddle's Update Subscription API with prorated_immediately proration.
 * Paddle handles proration, charges/credits. After a successful Paddle response,
 * updates the local DB immediately (subscription + user profile package_id).
 * The webhook acts as a backup confirmation, not the primary update path.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin, SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import {
  ErrorType,
  ErrorSeverity,
  type Database,
  type PricingTierDetails,
  getClientIP,
} from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { updatePaddleSubscription } from '@/lib/paddle/paddle-api-client';

type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type SubscriptionForUpdate = Pick<
  PaymentSubscriptionRow,
  'user_id' | 'paddle_subscription_id' | 'status'
>;

const updateRequestSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  newPriceId: z.string().min(1, 'New price ID is required'),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  // Guard: PADDLE_API_KEY must be configured
  if (!process.env.PADDLE_API_KEY) {
    const error = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      'Subscription updates are not available — payment gateway not configured',
      { severity: ErrorSeverity.MEDIUM, statusCode: 503 }
    );
    return formatError(error);
  }

  const body = await request.json();

  const validationResult = updateRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const error = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      validationResult.error.errors[0].message,
      { severity: ErrorSeverity.LOW, statusCode: 400 }
    );
    return formatError(error);
  }

  const { subscriptionId, newPriceId } = validationResult.data;

  // Verify ownership and that subscription is in an updatable state
  const subscription =
    await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionForUpdate | null>(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'verify_subscription_ownership_for_update',
        source: 'paddle/subscription/update',
        reason: 'User attempting to update subscription — ownership verification',
        metadata: {
          subscriptionId,
          newPriceId,
          endpoint: '/api/v1/payments/paddle/subscription/update',
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
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
      'You do not have permission to update this subscription',
      { severity: ErrorSeverity.MEDIUM, statusCode: 403, userId: auth.userId }
    );
    return formatError(error);
  }

  // Only active subscriptions can be updated
  if (subscription.status !== 'active') {
    const error = await ErrorHandlingService.createError(
      ErrorType.BUSINESS_LOGIC,
      `Cannot update subscription with status "${subscription.status}". Only active subscriptions can be upgraded or downgraded.`,
      { severity: ErrorSeverity.LOW, statusCode: 409, userId: auth.userId }
    );
    return formatError(error);
  }

  // Call Paddle API to update the subscription
  logger.info(
    { userId: auth.userId, subscriptionId, newPriceId },
    'User requesting subscription plan change'
  );

  const result = await updatePaddleSubscription(
    subscriptionId,
    [{ price_id: newPriceId, quantity: 1 }],
    'prorated_immediately',
    'prevent_change'
  );

  if (!result.ok) {
    // Map Paddle error to appropriate HTTP status
    const statusCode = result.status === 404 ? 404 : result.status >= 500 ? 502 : 400;

    const error = await ErrorHandlingService.createError(
      ErrorType.EXTERNAL_API,
      `Paddle subscription update failed: ${result.error.detail}`,
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

  // Return Paddle's confirmed subscription state.
  // Also update local DB immediately — don't wait for the async webhook.
  const paddleSub = result.data.data;
  const confirmedPriceId = paddleSub.items[0]?.price?.id ?? newPriceId;

  // Resolve which package the new price belongs to
  let newPackageId: string | null = null;
  try {
    const { data: packages } = await supabaseAdmin
      .from('indb_payment_packages')
      .select('id, pricing_tiers')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (packages) {
      for (const pkg of packages) {
        const tiers = pkg.pricing_tiers;
        if (!tiers || typeof tiers !== 'object') continue;
        const tierValues = Object.values(tiers) as PricingTierDetails[];
        for (const tier of tierValues) {
          if (tier && tier.paddle_price_id === confirmedPriceId) {
            newPackageId = pkg.id;
            break;
          }
        }
        if (newPackageId) break;
      }
    }
  } catch (lookupErr) {
    logger.warn({ error: lookupErr, confirmedPriceId }, 'Failed to resolve package from price ID');
  }

  // Update subscription + user profile in DB immediately
  if (newPackageId) {
    try {
      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'update_subscription_after_plan_change',
          reason: 'Immediate DB update after successful Paddle subscription update',
          source: 'paddle/subscription/update',
          metadata: { subscriptionId, confirmedPriceId, newPackageId },
        },
        {
          table: 'indb_payment_subscriptions',
          operationType: 'update',
          data: { paddle_price_id: confirmedPriceId, package_id: newPackageId },
          whereConditions: { paddle_subscription_id: subscriptionId },
        },
        async () => {
          await supabaseAdmin
            .from('indb_payment_subscriptions')
            .update({
              paddle_price_id: confirmedPriceId,
              package_id: newPackageId,
              current_period_end: paddleSub.current_billing_period?.ends_at ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('paddle_subscription_id', subscriptionId);

          await supabaseAdmin
            .from('indb_auth_user_profiles')
            .update({
              package_id: newPackageId,
              subscription_end_date: paddleSub.current_billing_period?.ends_at ?? null,
            })
            .eq('user_id', auth.userId);

          logger.info(
            { userId: auth.userId, newPackageId, confirmedPriceId },
            'Updated local DB immediately after plan change'
          );
        }
      );
    } catch (dbErr) {
      // Non-fatal — webhook will retry the update
      logger.warn({ error: dbErr }, 'Failed to update local DB after plan change — webhook will handle it');
    }
  }

  return formatSuccess({
    subscription: {
      id: paddleSub.id,
      status: paddleSub.status,
      items: paddleSub.items.map((item) => ({
        priceId: item.price.id,
        productId: item.price.product_id,
        quantity: item.quantity,
      })),
      currentBillingPeriod: paddleSub.current_billing_period ?? null,
      nextBilledAt: paddleSub.next_billed_at ?? null,
    },
    message: 'Subscription updated successfully.',
  });
});
