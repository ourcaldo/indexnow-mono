'use client';

import { Zap, Calendar, CheckCircle, BarChart3, DollarSign } from 'lucide-react';
import { UserProfile } from './index';
import { PackagePricingTiers, PricingTierDetails } from '@indexnow/shared';

interface PackageSubscriptionCardProps {
  user: UserProfile;
}

function getSafePricing(pricingTiers: unknown, billingPeriod: string): string {
  let tiers: PackagePricingTiers | null = null;

  // Handle string JSON or object
  if (typeof pricingTiers === 'string') {
    try {
      const parsed = JSON.parse(pricingTiers);
      if (typeof parsed === 'object' && parsed !== null) {
        tiers = parsed as PackagePricingTiers;
      }
    } catch {
      /* Invalid JSON — use default */
      return 'Free';
    }
  } else if (typeof pricingTiers === 'object' && pricingTiers !== null) {
    tiers = pricingTiers as PackagePricingTiers;
  }

  if (!tiers) return 'Free';

  const pricingData = tiers[billingPeriod];

  if (!pricingData) return 'Free';

  const price = pricingData.promo_price || pricingData.regular_price;

  if (price === undefined || price === null || price === 0) {
    return 'Free';
  }

  return `$${price.toLocaleString()}`;
}

function getSafeFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  return [];
}

export function PackageSubscriptionCard({ user }: PackageSubscriptionCardProps) {
  return (
    <div className="bg-background border-border rounded-lg border p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-accent/10 rounded-lg p-2">
          <Zap className="text-accent h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-bold">Package Subscription</h3>
          <p className="text-muted-foreground text-sm">
            Current subscription plan and quota details
          </p>
        </div>
      </div>

      {user.package ? (
        <div className="space-y-6">
          {/* Current Package Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-foreground font-medium">Current Plan</h4>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                    user.package.slug === 'free'
                      ? 'bg-muted/10 text-muted-foreground border-muted/20'
                      : user.package.slug === 'premium'
                        ? 'bg-accent/10 text-accent border-accent/20'
                        : user.package.slug === 'pro'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-muted/10 text-muted-foreground border-muted/20'
                  }`}
                >
                  {user.package.name}
                </span>
              </div>

              <div className="bg-secondary rounded-lg p-4">
                <p className="text-muted-foreground mb-2 text-sm">{user.package.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-lg font-bold">
                    {getSafePricing(user.package.pricing_tiers, user.package.billing_period)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    per{' '}
                    {user.package.billing_period === 'yearly'
                      ? 'annual'
                      : user.package.billing_period}
                  </span>
                </div>
              </div>

              {/* Package Features */}
              <div>
                <h5 className="text-foreground mb-2 font-medium">Features</h5>
                <ul className="space-y-1">
                  {getSafeFeatures(user.package.features).length > 0 ? (
                    getSafeFeatures(user.package.features).map((feature, index) => (
                      <li
                        key={index}
                        className="text-muted-foreground flex items-center space-x-2 text-sm"
                      >
                        <CheckCircle className="text-success h-4 w-4" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground text-sm">No features listed</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-foreground font-medium">Subscription Details</h4>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Subscribed
                    </p>
                    <p className="text-foreground text-sm">
                      {user.subscribed_at
                        ? new Date(user.subscribed_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Expires</p>
                    <p className="text-foreground text-sm">
                      {user.subscription_ends_at
                        ? new Date(user.subscription_ends_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BarChart3 className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Daily Quota
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-foreground text-sm">
                        {user.daily_quota_used || 0} / {user.daily_quota_limit || 0}
                      </p>
                      <span className="text-muted-foreground text-xs">URLs</span>
                    </div>

                    {/* Quota Progress Bar */}
                    <div className="bg-border mt-1 h-2 w-full rounded-full">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(((user.daily_quota_used || 0) / (user.daily_quota_limit || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Quota Reset
                    </p>
                    <p className="text-foreground text-sm">
                      {user.daily_quota_reset_date
                        ? new Date(user.daily_quota_reset_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <DollarSign className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h4 className="text-foreground mb-2 text-lg font-medium">No Active Subscription</h4>
          <p className="text-muted-foreground text-sm">
            This user doesn't have an active subscription package.
          </p>
        </div>
      )}
    </div>
  );
}
