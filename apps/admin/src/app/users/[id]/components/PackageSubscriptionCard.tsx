'use client';

import { Zap, Calendar, CheckCircle, BarChart3, DollarSign } from 'lucide-react';
import { UserProfile } from './index';
import { PackagePricingTiers } from '@indexnow/shared';

interface PackageSubscriptionCardProps {
  user: UserProfile;
}

function getSafePricing(pricingTiers: unknown, billingPeriod: string): string {
  let tiers: PackagePricingTiers | null = null;
  if (typeof pricingTiers === 'string') {
    try {
      const parsed = JSON.parse(pricingTiers);
      if (typeof parsed === 'object' && parsed !== null) tiers = parsed as PackagePricingTiers;
    } catch { return 'Free'; }
  } else if (typeof pricingTiers === 'object' && pricingTiers !== null) {
    tiers = pricingTiers as PackagePricingTiers;
  }
  if (!tiers) return 'Free';
  const pricingData = tiers[billingPeriod];
  if (!pricingData) return 'Free';
  const price = pricingData.promo_price || pricingData.regular_price;
  if (price === undefined || price === null || price === 0) return 'Free';
  return `$${price.toLocaleString()}`;
}

function getSafeFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features.filter((f): f is string => typeof f === 'string');
  return [];
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export function PackageSubscriptionCard({ user }: PackageSubscriptionCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <Zap className="w-4 h-4 text-gray-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Package Subscription</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current subscription plan and quota details</p>
        </div>
      </div>

      {user.package ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Plan</h4>
                <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-white/[0.07] dark:text-gray-300">
                  {user.package.name}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.package.description}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getSafePricing(user.package.pricing_tiers, user.package.billing_period)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    per {user.package.billing_period === 'yearly' ? 'annual' : user.package.billing_period}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</h5>
                <ul className="space-y-1">
                  {getSafeFeatures(user.package.features).length > 0 ? (
                    getSafeFeatures(user.package.features).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 dark:text-gray-400">No features listed</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Details</h4>
              <div className="space-y-3">
                <MetaRow icon={Calendar} label="Subscribed"
                  value={user.subscribed_at ? new Date(user.subscribed_at).toLocaleDateString() : 'N/A'} />
                <MetaRow icon={Calendar} label="Expires"
                  value={user.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'N/A'} />
                <MetaRow icon={Calendar} label="Quota Reset"
                  value={user.daily_quota_reset_date ? new Date(user.daily_quota_reset_date).toLocaleDateString() : 'N/A'} />

                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Daily Quota</p>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.daily_quota_used || 0} / {user.daily_quota_limit || 0}
                      </p>
                      <span className="text-xs text-gray-400">URLs</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-1.5 rounded-full bg-gray-600 dark:bg-gray-400 transition-all duration-300"
                        style={{ width: `${Math.min(((user.daily_quota_used || 0) / (user.daily_quota_limit || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <DollarSign className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No Active Subscription</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This user doesn't have an active subscription package.
          </p>
        </div>
      )}
    </div>
  );
}
