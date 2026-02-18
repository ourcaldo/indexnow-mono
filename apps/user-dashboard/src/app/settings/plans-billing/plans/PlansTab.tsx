'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  Crown,
  Star,
  ArrowRight,
  Package,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  Clock,
} from 'lucide-react';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';
import {
  formatCurrency,
  type ApiResponse,
  AUTH_ENDPOINTS,
  BILLING_ENDPOINTS,
  logger,
} from '@indexnow/shared';
import { LoadingSpinner, useApiError } from '@indexnow/ui';
import {
  getBillingPeriodPrice,
  buildCheckoutUrl,
  isTrialEligiblePackage,
  type PaymentPackage,
} from '@indexnow/ui/billing';

interface PackagesData {
  packages: PaymentPackage[];
  current_package_id: string | null;
  expires_at: string | null;
}

interface TrialEligibilityData {
  eligible: boolean;
}

export default function PlansTab() {
  const { handleApiError } = useApiError();
  const searchParams = useSearchParams();
  const [packagesData, setPackagesData] = useState<PackagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);

  // Check for checkout success
  useEffect(() => {
    if (searchParams?.get('checkout') === 'success') {
      setShowSuccessNotification(true);
      // Remove the query parameter
      window.history.replaceState({}, '', '/dashboard/settings/plans-billing');
    }
  }, [searchParams]);

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

      const result = (await response.json()) as ApiResponse<PackagesData>;
      // API now returns: { success: true, data: {...}, timestamp: "..." }
      if (!result.success) {
        throw new Error(result.error.message || 'Failed to load packages');
      }
      setPackagesData(result.data);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error loading packages');
      setError(error instanceof Error ? error.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkTrialEligibility = useCallback(async () => {
    try {
      const response = await authenticatedFetch(AUTH_ENDPOINTS.TRIAL_ELIGIBILITY);
      if (response.ok) {
        const result = (await response.json()) as ApiResponse<TrialEligibilityData>;
        if (result.success && result.data) {
          setTrialEligible(result.data.eligible);
        } else {
          setTrialEligible(false);
        }
      } else {
        setTrialEligible(false);
      }
    } catch (_err) {
      setTrialEligible(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
    checkTrialEligibility();
  }, [loadPackages, checkTrialEligibility]);

  const handleSubscribe = async (packageId: string) => {
    try {
      setSubscribing(packageId);
      window.location.href = buildCheckoutUrl(packageId, selectedBillingPeriod);
    } catch (error) {
      handleApiError(error, {
        context: 'PlansTab.handleSubscribe',
        toastTitle: 'Subscription Error',
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleStartTrial = async (packageId: string) => {
    try {
      setStartingTrial(packageId);
      window.location.href = buildCheckoutUrl(packageId, 'monthly', true);
    } catch (error) {
      handleApiError(error, { context: 'PlansTab.handleStartTrial', toastTitle: 'Trial Error' });
    } finally {
      setStartingTrial(null);
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
        <AlertCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
        <h3 className="text-foreground mb-2 text-lg font-semibold">Error Loading Plans</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadPackages}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const billingPeriods = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'annual', label: 'Annual', suffix: '/year' },
  ];

  // Get features directly from database - ONLY from database, no hardcoded features
  const getFeaturesForPlan = (pkg: PaymentPackage): string[] => {
    // Return ONLY the features from database, nothing else
    return Array.isArray(pkg.features) ? pkg.features : [];
  };

  const toggleComparePlans = () => {
    const newShowComparePlans = !showComparePlans;
    setShowComparePlans(newShowComparePlans);

    if (newShowComparePlans) {
      // Show all plan details when comparing
      const allExpanded: Record<string, boolean> = {};
      packagesData?.packages.forEach((pkg) => {
        allExpanded[pkg.id] = true;
      });
      setExpandedPlans(allExpanded);
    } else {
      // Hide all details when not comparing
      setExpandedPlans({});
    }
  };

  const togglePlanDetails = (planId: string) => {
    // Don't allow individual toggle when compare mode is active
    if (showComparePlans) return;

    // Only toggle the specific plan, clear all others
    setExpandedPlans({
      [planId]: !expandedPlans[planId],
    });
  };

  return (
    <div className="space-y-8">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="bg-success/10 border-success/20 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center">
            <CheckCircle className="text-success mr-3 h-5 w-5" />
            <div>
              <h3 className="text-foreground font-semibold">Order submitted successfully!</h3>
              <p className="text-muted-foreground text-sm">
                Payment instructions have been sent to your email. We'll activate your subscription
                once payment is confirmed.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessNotification(false)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-foreground mb-2 text-xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your rank tracking needs
        </p>

        {/* Compare Plans Button */}
        <div className="mt-4">
          <button
            onClick={toggleComparePlans}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {showComparePlans ? 'Hide comparison' : 'Compare plans'}
          </button>
        </div>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="bg-secondary flex rounded-lg p-1">
          {billingPeriods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedBillingPeriod(period.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                selectedBillingPeriod === period.key
                  ? 'bg-background text-foreground shadow-sm backdrop-blur-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {period.label}
              {period.key === 'annual' && (
                <span className="bg-success text-success-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                  Save 80%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2 lg:grid-cols-3">
        {packagesData?.packages.map((pkg) => {
          const pricingInfo = getBillingPeriodPrice(pkg, selectedBillingPeriod);
          const currentPeriod = billingPeriods.find((p) => p.key === selectedBillingPeriod);

          return (
            <div
              key={`plan-${pkg.id}-${selectedBillingPeriod}`}
              className={`bg-card relative flex h-full flex-col rounded-xl border-2 p-8 transition-all hover:shadow-lg ${
                pkg.is_popular
                  ? 'border-foreground shadow-md'
                  : pkg.is_current
                    ? 'border-success'
                    : 'border-border hover:border-accent'
              }`}
            >
              {/* Popular Badge */}
              {pkg.is_popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <div className="bg-foreground text-background flex items-center rounded-full px-4 py-2 text-sm font-medium">
                    <Star className="mr-1 h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {pkg.is_current && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <div className="bg-success text-success-foreground flex items-center rounded-full px-4 py-2 text-sm font-medium">
                    <Crown className="mr-1 h-4 w-4" />
                    Current Plan
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8 text-center">
                <h3 className="text-foreground mb-2 text-2xl font-bold">{pkg.name}</h3>
                <p className="text-muted-foreground mb-6">{pkg.description}</p>

                <div className="mb-6">
                  {pricingInfo.originalPrice && (
                    <div className="text-muted-foreground mb-1 text-lg line-through">
                      {formatCurrency(pricingInfo.originalPrice)}
                    </div>
                  )}
                  <div className="flex items-baseline justify-center">
                    <span className="text-foreground text-4xl font-bold">
                      {formatCurrency(pricingInfo.price)}
                    </span>
                    <span className="text-muted-foreground ml-1">{currentPeriod?.suffix}</span>
                  </div>
                  {pricingInfo.discount && (
                    <div className="text-success mt-1 text-sm font-medium">
                      Save {pricingInfo.discount}%
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="mb-8 flex-grow space-y-3">
                {getFeaturesForPlan(pkg).map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="text-success mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Expanded Details */}
              {expandedPlans[pkg.id] && (
                <div className="bg-secondary border-border mb-6 rounded-lg border p-4">
                  <div className="space-y-3">
                    {pkg.quota_limits?.rank_tracking_limit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Keywords:</span>
                        <span className="text-foreground font-medium">
                          {pkg.quota_limits.rank_tracking_limit === -1
                            ? 'Unlimited'
                            : pkg.quota_limits.rank_tracking_limit.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {pkg.quota_limits?.concurrent_jobs_limit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Concurrent Jobs:</span>
                        <span className="text-foreground font-medium">
                          {pkg.quota_limits.concurrent_jobs_limit === -1
                            ? 'Unlimited'
                            : pkg.quota_limits.concurrent_jobs_limit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!pkg.is_current && (
                <div className="space-y-3">
                  {/* Regular Subscription Button */}
                  <button
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={subscribing === pkg.id}
                    className={`flex h-12 w-full items-center justify-center rounded-lg px-4 py-3 font-medium transition-all ${
                      pkg.is_popular
                        ? 'bg-foreground text-background hover:bg-foreground/80 hover:shadow-md'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
                    } ${subscribing === pkg.id ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {subscribing === pkg.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upgrade'
                    )}
                  </button>

                  {/* Free Trial Button - Only show for eligible users and eligible packages */}
                  {trialEligible && isTrialEligiblePackage(pkg) && (
                    <button
                      onClick={() => handleStartTrial(pkg.id)}
                      disabled={startingTrial === pkg.id}
                      className={`flex h-12 w-full items-center justify-center rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                        pkg.is_popular
                          ? 'border-foreground text-foreground hover:bg-accent hover:text-accent-foreground'
                          : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                      } ${startingTrial === pkg.id ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {startingTrial === pkg.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Start 3-Day Free Trial
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="py-8 text-center">
        <div className="bg-secondary rounded-lg p-6">
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
