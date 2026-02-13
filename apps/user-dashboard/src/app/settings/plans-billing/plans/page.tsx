'use client'

import { useState, useEffect } from 'react'
import { 
  Check, 
  Crown, 
  Star, 
  ArrowRight,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { authService, BILLING_ENDPOINTS, formatCurrency, logger } from '@indexnow/shared'
import { supabaseBrowser as supabase } from '@indexnow/database'
import { LoadingSpinner, PricingCards, useApiError } from '@indexnow/ui'

interface PackageFeature {
  name: string
  included: boolean
  limit?: string
}

interface PricingTier {
  name: string
  regular_price: number
  promo_price?: number
  discount_percentage?: number
}

interface PaymentPackage {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  billing_period: string
  features: string[]
  quota_limits: {
    rank_tracking_limit: number
    concurrent_jobs_limit: number
  }
  is_popular: boolean
  is_current: boolean
  pricing_tiers: Record<string, PricingTier>
}

interface PackagesData {
  packages: PaymentPackage[]
  current_package_id: string | null
  expires_at: string | null
}

export default function PlansPage() {
  const { handleApiError } = useApiError()
  const [packagesData, setPackagesData] = useState<PackagesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('monthly')
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(BILLING_ENDPOINTS.PACKAGES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load packages')
      }

      const data = await response.json()
      setPackagesData(data)
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error loading packages')
      setError(error instanceof Error ? error.message : 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const getBillingPeriodPrice = (pkg: PaymentPackage, period: string): { price: number, originalPrice?: number, discount?: number } => {
    const tier = pkg.pricing_tiers?.[period]
    if (tier) {
      return {
        price: tier.promo_price || tier.regular_price,
        originalPrice: tier.promo_price ? tier.regular_price : undefined,
        discount: tier.discount_percentage
      }
    }
    return { price: 0 }
  }

  const handleSubscribe = async (packageId: string) => {
    try {
      setSubscribing(packageId)
      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Redirect to unified checkout page with selected package and billing period
      // This prevents duplicate transaction creation by using only the checkout API
      const checkoutUrl = `/dashboard/settings/plans-billing/checkout?package=${packageId}&period=${selectedBillingPeriod}`
      window.location.href = checkoutUrl

    } catch (error) {
      handleApiError(error, { context: 'PlansPage.handleSubscribe', toastTitle: 'Subscription Error' })
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Plans</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadPackages}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const billingPeriods = [
    { key: 'monthly', label: 'Monthly', suffix: '/month' },
    { key: '3-month', label: '3 Months', suffix: '/3 months' },
    { key: '6-month', label: '6 Months', suffix: '/6 months' },
    { key: 'annual', label: 'Annual', suffix: '/year' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan for your rank tracking needs. All plans include automated keyword monitoring and premium reporting features.
        </p>
      </div>

      <PricingCards 
        packages={packagesData?.packages || []}
        selectedBillingPeriod={selectedBillingPeriod}
        setSelectedBillingPeriod={setSelectedBillingPeriod}
        subscribing={subscribing}
        trialEligible={false} // Adjust as needed
        startingTrial={null}
        showDetails={{}}
        showComparePlans={false}
        getBillingPeriodPrice={getBillingPeriodPrice}
        formatCurrency={formatCurrency}
        handleSubscribe={handleSubscribe}
        handleStartTrial={() => {}}
        isTrialEligiblePackage={() => false}
        togglePlanDetails={() => {}}
      />

      {/* Additional Info */}
      <div className="text-center py-8">
        <div className="bg-secondary rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-foreground mb-2">Need Help Choosing?</h3>
          <p className="text-muted-foreground mb-4">
            All plans include 24/7 support, real-time rank monitoring, and access to our premium dashboard features.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-success mr-1" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-success mr-1" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-success mr-1" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
