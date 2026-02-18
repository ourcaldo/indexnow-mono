'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Crown, Star, ArrowRight, Package, AlertCircle, Loader2 } from 'lucide-react';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';
import { BILLING_ENDPOINTS, formatCurrency, logger } from '@indexnow/shared';
import { LoadingSpinner, useApiError, ErrorState } from '@indexnow/ui';
import {
  PricingCards,
  getBillingPeriodPrice,
  buildCheckoutUrl,
  type PaymentPackage,
} from '@indexnow/ui/billing';

interface PackagesData {
  packages: PaymentPackage[];
  current_package_id: string | null;
  expires_at: string | null;
}

export default function PlansPage() {
  const { handleApiError } = useApiError();
  const [packagesData, setPackagesData] = useState<PackagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await authenticatedFetch(BILLING_ENDPOINTS.PACKAGES);

      if (!response.ok) {
        throw new Error('Failed to load packages');
      }

      const data = await response.json();
      setPackagesData(data);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error loading packages');
      setError(error instanceof Error ? error.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSubscribe = async (packageId: string) => {
    try {
      setSubscribing(packageId);
      window.location.href = buildCheckoutUrl(packageId, selectedBillingPeriod);
    } catch (error) {
      handleApiError(error, {
        context: 'PlansPage.handleSubscribe',
        toastTitle: 'Subscription Error',
      });
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <ErrorState title="Error Loading Plans" message={error} onRetry={loadPackages} />
      </div>
    );
  }

  const billingPeriods = [
    { key: 'monthly', label: 'Monthly', suffix: '/month' },
    { key: '3-month', label: '3 Months', suffix: '/3 months' },
    { key: '6-month', label: '6 Months', suffix: '/6 months' },
    { key: 'annual', label: 'Annual', suffix: '/year' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-foreground mb-4 text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Select the perfect plan for your rank tracking needs. All plans include automated keyword
          monitoring and premium reporting features.
        </p>
      </div>

      <PricingCards
        packages={packagesData?.packages || []}
        selectedBillingPeriod={selectedBillingPeriod}
        setSelectedBillingPeriod={setSelectedBillingPeriod}
        subscribing={subscribing}
        trialEligible={false} // Adjust as needed
        startingTrial={null}
        showDetails={{}}
        showComparePlans={false}
        getBillingPeriodPrice={getBillingPeriodPrice}
        formatCurrency={formatCurrency}
        handleSubscribe={handleSubscribe}
        handleStartTrial={() => {}}
        isTrialEligiblePackage={() => false}
        togglePlanDetails={() => {}}
      />

      {/* Additional Info */}
      <div className="py-8 text-center">
        <div className="bg-secondary mx-auto max-w-4xl rounded-lg p-6">
          <h3 className="text-foreground mb-2 text-lg font-semibold">Need Help Choosing?</h3>
          <p className="text-muted-foreground mb-4">
            All plans include 24/7 support, real-time rank monitoring, and access to our premium
            dashboard features.
          </p>
          <div className="text-muted-foreground flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center">
              <Check className="text-success mr-1 h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="text-success mr-1 h-4 w-4" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center">
              <Check className="text-success mr-1 h-4 w-4" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
