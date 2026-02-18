'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { formatCurrency } from '@indexnow/shared';
import { type PaymentPackage } from '../billing/types';

interface PricingTier {
  period?: string; // Required when in array
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

  // Helper to get tier data regardless of structure (Array vs Record)
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
    <Card className="border-border bg-background">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground text-lg font-semibold">Billing Period</CardTitle>
        <p className="text-muted-foreground text-sm">Choose your preferred billing cycle</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {periodOptions.map((option, index) => {
            const discount = calculateDiscount(option.regular_price, option.promo_price);
            const finalPrice = option.promo_price || option.regular_price;
            const isSelected = selectedPeriod === option.period;

            return (
              <div
                key={`${option.period}-${index}`}
                className={`relative cursor-pointer rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent hover:bg-secondary'
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected ? 'border-accent bg-accent' : 'border-border bg-white'
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white"></div>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground font-medium">{option.period_label}</span>
                      {discount > 0 && (
                        <span className="bg-warning rounded-full px-2 py-0.5 text-xs font-medium text-white">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {option.promo_price &&
                        option.regular_price > 0 &&
                        option.regular_price !== option.promo_price && (
                          <span className="text-muted-foreground text-sm line-through">
                            {formatCurrency(option.regular_price, selectedPackage.currency)}
                          </span>
                        )}
                      <span
                        className="text-foreground text-lg font-bold"
                        data-testid={`price-${option.period}`}
                      >
                        {formatCurrency(finalPrice, selectedPackage.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
