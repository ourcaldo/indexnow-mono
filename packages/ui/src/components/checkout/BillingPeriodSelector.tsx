'use client';

import React from 'react';
import { formatCurrency } from '@indexnow/shared';
import { type PaymentPackage } from '../billing/types';

interface PricingTier {
  period?: string;
  period_label?: string;
  regular_price: number;
  promo_price?: number;
  paddle_price_id?: string;
  [key: string]: string | number | undefined;
}

interface BillingPeriodOption {
  period: string;
  period_label: string;
  regular_price: number;
  promo_price?: number;
  paddle_price_id?: string;
}

interface BillingPeriodSelectorProps {
  selectedPackage: PaymentPackage | null;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function BillingPeriodSelector({
  selectedPackage,
  selectedPeriod,
  onPeriodChange,
}: BillingPeriodSelectorProps) {
  if (!selectedPackage || !selectedPackage.pricing_tiers) {
    return null;
  }

  const pricingTiers = selectedPackage.pricing_tiers;
  const periodOrder = ['monthly', 'quarterly', 'biannual', 'annual'];

  const getTierForPeriod = (period: string): PricingTier | undefined => {
    if (Array.isArray(pricingTiers)) {
      return pricingTiers.find((t) => t.period === period);
    }
    return (pricingTiers as Record<string, PricingTier>)[period];
  };

  const availablePeriods = periodOrder.filter((period) => getTierForPeriod(period) !== undefined);

  const formatPeriodOptions = (): BillingPeriodOption[] => {
    return availablePeriods.map((period) => {
      const tierData = getTierForPeriod(period)!;
      return {
        period,
        period_label: tierData.period_label || period.charAt(0).toUpperCase() + period.slice(1),
        regular_price: tierData.regular_price,
        promo_price: tierData.promo_price,
        paddle_price_id: tierData.paddle_price_id,
      };
    });
  };

  const periodOptions = formatPeriodOptions();

  const calculateDiscount = (regular: number, promo?: number) => {
    if (!promo || promo >= regular) return 0;
    return Math.round(((regular - promo) / regular) * 100);
  };

  return (
    <div className="rounded-xl border border-border bg-background p-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(periodOptions.length, 4)}, 1fr)` }}>
        {periodOptions.map((option, index) => {
          const discount = calculateDiscount(option.regular_price, option.promo_price);
          const finalPrice = option.promo_price || option.regular_price;
          const isSelected = selectedPeriod === option.period;

          return (
            <button
              key={`${option.period}-${index}`}
              type="button"
              className={`relative rounded-lg px-3 py-3 text-center transition-all ${
                isSelected
                  ? 'bg-accent text-white shadow-sm'
                  : 'hover:bg-secondary text-foreground'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedPeriod !== option.period) {
                  onPeriodChange(option.period);
                }
              }}
              data-testid={`billing-period-${option.period}`}
            >
              {discount > 0 && (
                <span
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[10px] font-semibold ${
                    isSelected
                      ? 'bg-white text-accent'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  -{discount}%
                </span>
              )}
              <span className={`block text-xs font-medium ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                {option.period_label}
              </span>
              <span className="mt-0.5 block text-sm font-bold" data-testid={`price-${option.period}`}>
                {formatCurrency(finalPrice)}
              </span>
              {option.promo_price &&
                option.regular_price > 0 &&
                option.regular_price !== option.promo_price && (
                  <span
                    className={`block text-[11px] line-through ${
                      isSelected ? 'text-white/50' : 'text-muted-foreground/60'
                    }`}
                  >
                    {formatCurrency(option.regular_price)}
                  </span>
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
