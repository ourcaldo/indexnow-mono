import type { PaymentPackage } from './types'

export interface BillingPriceResult {
  price: number
  originalPrice?: number
  discount?: number
}

/**
 * Canonical pricing resolver — handles both object and array pricing_tiers formats.
 * Normalizes 'yearly' → 'annual' for backward compat with older API payloads.
 */
export function getBillingPeriodPrice(
  pkg: PaymentPackage,
  period: string
): BillingPriceResult {
  const apiPeriod = period === 'yearly' ? 'annual' : period

  // Object format (primary): { monthly: { promo_price, regular_price, ... }, annual: { ... } }
  if (pkg.pricing_tiers && typeof pkg.pricing_tiers === 'object' && !Array.isArray(pkg.pricing_tiers)) {
    const tier = (pkg.pricing_tiers as Record<string, { promo_price?: number; regular_price: number; discount_percentage?: number }>)[apiPeriod]
    if (tier) {
      const price = tier.promo_price || tier.regular_price
      const originalPrice = tier.promo_price && tier.promo_price < tier.regular_price ? tier.regular_price : undefined
      const discount = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : tier.discount_percentage
      return { price, originalPrice, discount: discount && discount > 0 ? discount : undefined }
    }
  }

  // Array format (legacy): [{ period: 'monthly', promo_price, regular_price, discount_percentage }]
  if (Array.isArray(pkg.pricing_tiers)) {
    const tier = (pkg.pricing_tiers as Array<{ period: string; promo_price?: number; regular_price: number; discount_percentage?: number }>)
      .find(t => t.period === apiPeriod)
    if (tier) {
      return {
        price: tier.promo_price || tier.regular_price,
        originalPrice: tier.promo_price ? tier.regular_price : undefined,
        discount: tier.discount_percentage
      }
    }
  }

  // Fallback: use the flat price field on the package itself
  return { price: (pkg as PaymentPackage & { price?: number }).price ?? 0 }
}

/**
 * Build checkout redirect URL for a subscription purchase.
 */
export function buildCheckoutUrl(packageId: string, period: string, trial = false): string {
  const base = `/dashboard/settings/plans-billing/checkout?package=${packageId}&period=${period}`
  return trial ? `${base}&trial=true` : base
}

/**
 * Check whether a package is eligible for a free trial.
 */
export function isTrialEligiblePackage(pkg: PaymentPackage): boolean {
  return (pkg as PaymentPackage & { free_trial_enabled?: boolean }).free_trial_enabled === true
}

/**
 * Format transaction type for display.
 */
export function formatTransactionType(type: string): string {
  switch (type) {
    case 'subscription': return 'New Subscription'
    case 'renewal': return 'Renewal'
    case 'upgrade': return 'Plan Upgrade'
    case 'downgrade': return 'Plan Downgrade'
    default: return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

/**
 * Get status display color classes for a transaction status.
 */
export function getTransactionStatusColors(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'completed': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
    case 'pending':
    case 'proof_uploaded': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' }
    case 'failed': return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' }
    case 'cancelled': return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' }
    default: return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' }
  }
}
