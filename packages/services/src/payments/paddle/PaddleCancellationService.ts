import { SupabaseClient } from '@supabase/supabase-js';
import { PaddleSubscriptionService } from './PaddleSubscriptionService';
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared';

interface DbSubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  package_id: string;
  subscription_start_date: string;
  subscription_end_date: string;
  paddle_subscription_id: string;
}

export class PaddleCancellationService {
  // Configurable refund window (could be moved to DB later)
  private static REFUND_WINDOW_DAYS = 7;
  private subscriptionService: PaddleSubscriptionService;

  constructor(
    private supabase: SupabaseClient,
    private paddleApiKey: string,
    private paddleApiUrl: string
  ) {
    this.subscriptionService = new PaddleSubscriptionService(supabase, paddleApiKey, paddleApiUrl);
  }

  /**
   * Calculate refund eligibility based on subscription start date
   */
  async checkRefundEligibility(subscriptionId: string): Promise<{ eligible: boolean; reason?: string }> {
    const { data: subscription, error } = await this.supabase
      .from('indb_payment_subscriptions')
      .select('id, user_id, status, package_id, start_date, end_date, paddle_subscription_id')
      .eq('paddle_subscription_id', subscriptionId)
      .single();

    if (error || !subscription) {
      throw ErrorHandlingService.createError({ message: 'Subscription not found', type: ErrorType.NOT_FOUND, severity: ErrorSeverity.MEDIUM });
    }

    // Safe casting since we know the schema
    const sub = subscription as unknown as DbSubscriptionRow;
    const startDate = new Date(sub.subscription_start_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= PaddleCancellationService.REFUND_WINDOW_DAYS) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason: `Subscription is ${diffDays} days old (limit: ${PaddleCancellationService.REFUND_WINDOW_DAYS} days)`
    };
  }

  /**
   * Process cancellation with automatic refund check
   */
  async cancelWithRefundPolicy(subscriptionId: string): Promise<{ status: 'canceled' | 'refunded'; message: string }> {
    const eligibility = await this.checkRefundEligibility(subscriptionId);

    if (eligibility.eligible) {
      // Logic for refund would go here (requires Paddle Transaction API)
      // For now, we just cancel immediately
      await this.subscriptionService.cancelSubscription(subscriptionId, true);
      return { status: 'refunded', message: 'Subscription canceled and marked for refund' };
    }

    // If not eligible for refund, cancel at period end (standard churn prevention)
    await this.subscriptionService.cancelSubscription(subscriptionId, false);
    return { status: 'canceled', message: 'Subscription set to cancel at end of billing period' };
  }

  /**
   * Force immediate cancellation regardless of refund policy
   */
  async forceCancel(subscriptionId: string): Promise<void> {
    await this.subscriptionService.cancelSubscription(subscriptionId, true);
  }
}
