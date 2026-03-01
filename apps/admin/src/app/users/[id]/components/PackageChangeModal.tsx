'use client';

import { X, Check } from 'lucide-react';

interface PricingTier {
  promo_price: number;
  regular_price: number;
  period_label: string;
  paddle_price_id?: string;
}

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  currency: string;
  billing_period: string;
  pricing_tiers?: {
    monthly?: PricingTier;
    annual?: PricingTier;
  };
}

interface PackageChangeModalProps {
  isOpen: boolean;
  availablePackages: Package[];
  selectedPackageId: string;
  changePackageLoading: boolean;
  onClose: () => void;
  onPackageSelect: (packageId: string) => void;
  onSubmit: () => void;
}

export function PackageChangeModal({
  isOpen, availablePackages, selectedPackageId, changePackageLoading,
  onClose, onPackageSelect, onSubmit,
}: PackageChangeModalProps) {
  if (!isOpen) return null;

  const getPackagePrice = (pkg: Package): string => {
    const billingPeriod = pkg.billing_period || 'monthly';
    const tierPricing = pkg.pricing_tiers?.[billingPeriod as 'monthly' | 'annual'];
    if (!tierPricing) return 'Free';
    const price = tierPricing.promo_price ?? tierPricing.regular_price;
    if (price === null || price === undefined || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Package</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select a new package for this user</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {availablePackages.map((pkg) => {
            const selected = selectedPackageId === pkg.id;
            return (
              <label
                key={pkg.id}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  selected
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-white/[0.04]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }`}
              >
                <input
                  type="radio" name="package" value={pkg.id}
                  checked={selected} onChange={(e) => onPackageSelect(e.target.value)}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {pkg.slug}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pkg.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{getPackagePrice(pkg)}</p>
                    <p className="text-xs text-gray-400">per {pkg.billing_period || 'monthly'}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected
                      ? 'border-gray-600 dark:border-gray-400 bg-gray-600 dark:bg-gray-400'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!selectedPackageId || changePackageLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white/10 text-white border border-gray-700 dark:border-white/10 rounded-md hover:bg-gray-800 dark:hover:bg-white/[0.15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePackageLoading ? 'Changing...' : 'Change Package'}
          </button>
        </div>
      </div>
    </div>
  );
}
