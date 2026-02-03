'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../card'

// Note: formatCurrency should ideally be passed as a prop or imported from a shared utils in UI
// For now, we'll use a local mock or expect it from shared if available
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

interface PricingTier {
  period_label?: string;
  regular_price: number;
  promo_price?: number;
  paddle_price_id?: string;
  [key: string]: string | number | undefined;
}

interface PaymentPackage {
  currency?: string;
  pricing_tiers?: Record<string, PricingTier> | null;
  [key: string]: unknown;
}

interface BillingPeriodOption {
  period: string
  period_label: string
  regular_price: number
  promo_price?: number
  paddle_price_id?: string
}

interface BillingPeriodSelectorProps {
  selectedPackage: PaymentPackage | null
  selectedPeriod: string
  onPeriodChange: (period: string) => void
}

export function BillingPeriodSelector({
  selectedPackage,
  selectedPeriod,
  onPeriodChange
}: BillingPeriodSelectorProps) {
  if (!selectedPackage || !selectedPackage.pricing_tiers) {
    return null
  }

  const pricingTiers = selectedPackage.pricing_tiers;
  const periodOrder = ['monthly', 'quarterly', 'biannual', 'annual']
  const availablePeriods = periodOrder.filter(period => 
    pricingTiers[period]
  )

  const formatPeriodOptions = (): BillingPeriodOption[] => {
    if (!pricingTiers) return []
    return availablePeriods.map(period => {
      const tierData = pricingTiers[period]
      return {
        period,
        period_label: tierData.period_label || period.charAt(0).toUpperCase() + period.slice(1),
        regular_price: tierData.regular_price,
        promo_price: tierData.promo_price,
        paddle_price_id: tierData.paddle_price_id
      }
    })
  }

  const periodOptions = formatPeriodOptions()

  const calculateDiscount = (regular: number, promo?: number) => {
    if (!promo || promo >= regular) return 0
    return Math.round(((regular - promo) / regular) * 100)
  }

  return (
    <Card className="border-border bg-background">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Billing Period</CardTitle>
        <p className="text-sm text-muted-foreground">Choose your preferred billing cycle</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {periodOptions.map((option, index) => {
            const discount = calculateDiscount(option.regular_price, option.promo_price)
            const finalPrice = option.promo_price || option.regular_price
            const isSelected = selectedPeriod === option.period
            
            return (
              <div
                key={`${option.period}-${index}`}
                className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent hover:bg-secondary'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (selectedPeriod !== option.period) {
                    onPeriodChange(option.period)
                  }
                }}
                data-testid={`billing-period-${option.period}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-accent bg-accent' 
                          : 'border-border bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">
                        {option.period_label}
                      </span>
                      {discount > 0 && (
                        <span className="bg-warning text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {option.promo_price && option.regular_price > 0 && option.regular_price !== option.promo_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(option.regular_price, selectedPackage.currency)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-foreground" data-testid={`price-${option.period}`}>
                        {formatCurrency(finalPrice, selectedPackage.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
