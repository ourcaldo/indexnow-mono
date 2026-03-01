'use client';

import { CheckCircle, Calendar, DollarSign } from 'lucide-react';
import type { UserProfile } from './index';
import type { PackagePricingTiers } from '@indexnow/shared';

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
  if (!price) return 'Free';
  return `$${price.toLocaleString()}`;
}

function getSafeFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features.filter((f): f is string => typeof f === 'string');
  return [];
}

export function PackageSubscriptionCard({ user }: { user: UserProfile }) {
  if (!user.package) {
    return (
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Subscription</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">No active subscription.</p>
      </div>
    );
  }

  const { package: pkg } = user;
  const features = getSafeFeatures(pkg.features);

  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg">

      {/* Header: plan name + price */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
          {pkg.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pkg.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
            {getSafePricing(pkg.pricing_tiers, pkg.billing_period)}
          </p>
          <p className="text-xs text-gray-400">
            per {pkg.billing_period === 'yearly' ? 'year' : pkg.billing_period}
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Subscription dates */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Subscribed</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.subscribed_at ? new Date(user.subscribed_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quota resets</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.daily_quota_reset_date ? new Date(user.daily_quota_reset_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expires at</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.expires_at ? new Date(user.expires_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Feature list */}
        {features.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Included features</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}