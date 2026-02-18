'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@indexnow/ui';
import { useActivityLogger } from '@indexnow/ui/hooks';

export function useSubscriptionNotifications() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { logDashboardActivity } = useActivityLogger();

  useEffect(() => {
    const status = searchParams?.get('subscription');

    if (status === 'success') {
      addToast({
        title: 'Subscription Activated!',
        description: 'Your subscription has been successfully activated. Welcome aboard!',
        type: 'success',
      });

      logDashboardActivity(
        'subscription_success',
        'Subscription successfully activated via Paddle',
        {
          timestamp: new Date().toISOString(),
        }
      );

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.toString());
    } else if (status === 'failed') {
      addToast({
        title: 'Payment Failed',
        description:
          'There was an issue processing your payment. Please try again or contact support.',
        type: 'error',
      });

      logDashboardActivity('subscription_failed', 'Subscription payment failed', {
        timestamp: new Date().toISOString(),
      });

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.toString());
    } else if (status === 'cancelled') {
      addToast({
        title: 'Checkout Cancelled',
        description: 'You cancelled the checkout process. You can try again anytime.',
        type: 'info',
      });

      logDashboardActivity('subscription_cancelled', 'User cancelled checkout', {
        timestamp: new Date().toISOString(),
      });

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, addToast, logDashboardActivity]);
}
