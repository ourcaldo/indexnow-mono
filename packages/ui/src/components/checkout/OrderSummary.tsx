'use client'

import { Check, Shield } from 'lucide-react'
import { formatCurrency } from '@indexnow/shared'

interface PricingTier {
  regular_price: number;
  promo_price?: number;
  period_label?: string;
  paddle_price_id?: string;
}

interface PaymentPackage {
  id: string;
  name: string;
  features: string[];
  pricing_tiers?: Record<string, PricingTier>;
}

interface OrderSummaryProps {
  selectedPackage: PaymentPackage | null
  billingPeriod: string
  isTrialFlow?: boolean
}

export function OrderSummary({ selectedPackage, billingPeriod, isTrialFlow = false }: OrderSummaryProps) {
  if (!selectedPackage) return null

  const calculatePrice = () => {
    if (selectedPackage.pricing_tiers?.[billingPeriod]) {
      const pricingData = selectedPackage.pricing_tiers[billingPeriod]
      const price = pricingData.promo_price || pricingData.regular_price
      const originalPrice = pricingData.regular_price
      const discount = pricingData.promo_price 
        ? Math.round(((originalPrice - pricingData.promo_price) / originalPrice) * 100) 
        : 0
      const periodLabel = pricingData.period_label || billingPeriod

      return { price, discount, originalPrice, periodLabel }
    }

    return { price: 0, discount: 0, originalPrice: 0, periodLabel: billingPeriod }
  }

  const { price, discount, originalPrice, periodLabel } = calculatePrice()

  const getTrialPricing = () => {
    if (!isTrialFlow) return null
    const trialAmount = price > 0 ? price : 0
    const trialDays = 7
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + trialDays)
    const futureDateStr = futureDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    return {
      trialAmount,
      futureBillingDate: futureDateStr,
      futureAmount: price
    }
  }

  const trialInfo = getTrialPricing()

  return (
    <div className="sticky top-20 rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-sm font-semibold text-foreground">Order summary</h3>
      </div>

      {/* Package card */}
      <div className="mx-5 rounded-lg bg-secondary/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{selectedPackage.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
              {periodLabel} billing
            </p>
          </div>
          {discount > 0 && (
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              -{discount}%
            </span>
          )}
        </div>

        {/* Features */}
        {selectedPackage.features && selectedPackage.features.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {selectedPackage.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
            {selectedPackage.features.length > 4 && (
              <p className="pl-5.5 text-[11px] text-muted-foreground/70">
                +{selectedPackage.features.length - 4} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="px-5 py-4 space-y-3">
        {isTrialFlow && trialInfo ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today's charge</span>
              <span className="font-medium text-foreground">
                {formatCurrency(trialInfo.trialAmount)}
              </span>
            </div>

            <div className="border-t border-border" />

            <div className="rounded-lg bg-accent/5 border border-accent/10 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                After your 7-day trial, you'll be charged{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(trialInfo.futureAmount)}
                </span>{' '}
                on {trialInfo.futureBillingDate}.
              </p>
            </div>

            <div className="border-t border-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total today</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(trialInfo.trialAmount)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(originalPrice)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount ({discount}%)</span>
                <span className="font-medium text-accent">
                  -{formatCurrency(originalPrice - price)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium text-foreground">{formatCurrency(0)}</span>
            </div>

            <div className="border-t border-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(price)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Security footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="text-[11px] text-muted-foreground/60">
          Encrypted & secure checkout
        </span>
      </div>
    </div>
  )
}
