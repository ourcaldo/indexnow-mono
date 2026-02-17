import { describe, it, expect } from 'vitest'
import {
  getBillingPeriodPrice,
  buildCheckoutUrl,
  isTrialEligiblePackage,
  formatTransactionType,
  getTransactionStatusColors,
} from '../billing-utils'
import type { PaymentPackage } from '../types'

// Minimal PaymentPackage stubs
const makePackage = (overrides: Partial<PaymentPackage> = {}): PaymentPackage => ({
  id: 'pkg-1',
  name: 'Pro',
  pricing_tiers: {},
  ...overrides,
} as PaymentPackage)

describe('getBillingPeriodPrice', () => {
  it('resolves price from object-format pricing_tiers', () => {
    const pkg = makePackage({
      pricing_tiers: {
        monthly: { regular_price: 29, promo_price: 19, discount_percentage: 34 },
        annual: { regular_price: 290, promo_price: 240, discount_percentage: 17 },
      },
    })
    const monthly = getBillingPeriodPrice(pkg, 'monthly')
    expect(monthly.price).toBe(19)
    expect(monthly.originalPrice).toBe(29)
    expect(monthly.discount).toBe(34)

    const annual = getBillingPeriodPrice(pkg, 'annual')
    expect(annual.price).toBe(240)
    expect(annual.originalPrice).toBe(290)
  })

  it('normalizes "yearly" to "annual"', () => {
    const pkg = makePackage({
      pricing_tiers: {
        annual: { regular_price: 100 },
      },
    })
    const result = getBillingPeriodPrice(pkg, 'yearly')
    expect(result.price).toBe(100)
  })

  it('resolves price from array-format pricing_tiers', () => {
    const pkg = makePackage({
      pricing_tiers: [
        { period: 'monthly', regular_price: 20, promo_price: 15, discount_percentage: 25 },
        { period: 'annual', regular_price: 200 },
      ] as unknown as PaymentPackage['pricing_tiers'],
    })
    const monthly = getBillingPeriodPrice(pkg, 'monthly')
    expect(monthly.price).toBe(15)
    expect(monthly.originalPrice).toBe(20)
    expect(monthly.discount).toBe(25)

    const annual = getBillingPeriodPrice(pkg, 'annual')
    expect(annual.price).toBe(200)
    expect(annual.originalPrice).toBeUndefined()
  })

  it('falls back to pkg.price when tier is not found', () => {
    const pkg = makePackage({ pricing_tiers: {} })
    ;(pkg as PaymentPackage & { price: number }).price = 99
    const result = getBillingPeriodPrice(pkg, 'monthly')
    expect(result.price).toBe(99)
  })

  it('returns 0 when no price information exists', () => {
    const pkg = makePackage({ pricing_tiers: {} })
    const result = getBillingPeriodPrice(pkg, 'monthly')
    expect(result.price).toBe(0)
  })

  it('handles promo_price equal to regular_price (no discount)', () => {
    const pkg = makePackage({
      pricing_tiers: {
        monthly: { regular_price: 20, promo_price: 20 },
      },
    })
    const result = getBillingPeriodPrice(pkg, 'monthly')
    expect(result.price).toBe(20)
    expect(result.originalPrice).toBeUndefined()
  })
})

describe('buildCheckoutUrl', () => {
  it('builds standard checkout URL', () => {
    const url = buildCheckoutUrl('pkg-123', 'monthly')
    expect(url).toBe('/dashboard/settings/plans-billing/checkout?package=pkg-123&period=monthly')
  })

  it('appends trial parameter when trial=true', () => {
    const url = buildCheckoutUrl('pkg-123', 'annual', true)
    expect(url).toContain('&trial=true')
  })

  it('does not include trial param by default', () => {
    const url = buildCheckoutUrl('pkg-123', 'monthly')
    expect(url).not.toContain('trial')
  })
})

describe('isTrialEligiblePackage', () => {
  it('returns true when free_trial_enabled is true', () => {
    const pkg = makePackage()
    ;(pkg as PaymentPackage & { free_trial_enabled: boolean }).free_trial_enabled = true
    expect(isTrialEligiblePackage(pkg)).toBe(true)
  })

  it('returns false when free_trial_enabled is not set', () => {
    const pkg = makePackage()
    expect(isTrialEligiblePackage(pkg)).toBe(false)
  })

  it('returns false when free_trial_enabled is false', () => {
    const pkg = makePackage()
    ;(pkg as PaymentPackage & { free_trial_enabled: boolean }).free_trial_enabled = false
    expect(isTrialEligiblePackage(pkg)).toBe(false)
  })
})

describe('formatTransactionType', () => {
  it('maps known types to display names', () => {
    expect(formatTransactionType('subscription')).toBe('New Subscription')
    expect(formatTransactionType('renewal')).toBe('Renewal')
    expect(formatTransactionType('upgrade')).toBe('Plan Upgrade')
    expect(formatTransactionType('downgrade')).toBe('Plan Downgrade')
  })

  it('capitalizes unknown types', () => {
    expect(formatTransactionType('refund')).toBe('Refund')
    expect(formatTransactionType('credit')).toBe('Credit')
  })
})

describe('getTransactionStatusColors', () => {
  it('returns success colors for completed', () => {
    const colors = getTransactionStatusColors('completed')
    expect(colors.text).toContain('success')
    expect(colors.bg).toContain('success')
  })

  it('returns warning colors for pending', () => {
    const colors = getTransactionStatusColors('pending')
    expect(colors.text).toContain('warning')
  })

  it('returns warning colors for proof_uploaded', () => {
    const colors = getTransactionStatusColors('proof_uploaded')
    expect(colors.text).toContain('warning')
  })

  it('returns destructive colors for failed', () => {
    const colors = getTransactionStatusColors('failed')
    expect(colors.text).toContain('destructive')
  })

  it('returns muted colors for cancelled', () => {
    const colors = getTransactionStatusColors('cancelled')
    expect(colors.text).toContain('muted')
  })

  it('returns muted colors for unknown status', () => {
    const colors = getTransactionStatusColors('unknown')
    expect(colors.text).toContain('muted')
  })
})
