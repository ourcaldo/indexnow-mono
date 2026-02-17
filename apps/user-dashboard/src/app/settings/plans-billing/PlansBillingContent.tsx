'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Download } from 'lucide-react'
import { authService, authenticatedFetch, AppConfig, BILLING_ENDPOINTS, PUBLIC_ENDPOINTS, type Json, formatCurrency, formatDate, logger } from '@indexnow/shared'
import { supabaseBrowser as supabase } from '@indexnow/database'
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui/hooks'
import {
  LoadingSpinner,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  useToast,
  useApiError,
  ErrorState,
} from '@indexnow/ui'
import {
  CancelSubscriptionDialog,
  SubscriptionStatusBadge,
  BillingStats,
  PricingCards,
  BillingHistory,
  getBillingPeriodPrice,
  buildCheckoutUrl,
  isTrialEligiblePackage,
  type PaymentPackage,
  type Transaction,
  type BillingHistoryData,
  type BillingData,
  type KeywordUsageData
} from '@indexnow/ui/billing'

// Type definitions
interface SubscriptionData {
  hasSubscription: boolean;
  subscription?: {
    paddle_subscription_id: string;
    status: string;
    expires_at: string;
    package_id: string;
  };
}

interface PackagesData {
  packages: PaymentPackage[]
  current_package_id: string | null
  expires_at: string | null
  user_currency?: string
  user_country?: string
}

interface UsageData {
  package_name: string
}

export default function BillingPage() {
  // State management
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [packagesData, setPackagesData] = useState<PackagesData | null>(null)
  const [historyData, setHistoryData] = useState<BillingHistoryData | null>(null)
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [keywordUsage, setKeywordUsage] = useState<KeywordUsageData | null>(null)
  const [totalKeywords, setTotalKeywords] = useState<number>(0)
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscription management state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Plans section state
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('monthly')
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [startingTrial, setStartingTrial] = useState<string | null>(null)

  // Billing history pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Hooks
  const router = useRouter()
  const { addToast } = useToast()
  const { handleApiError } = useApiError()
  const { logBillingActivity } = useActivityLogger()
  usePageViewLogger('/dashboard/settings/plans-billing', 'Billing & Subscriptions', { section: 'billing_management' })

  // Load data on mount
  useEffect(() => {
    loadAllData()

    // Handle payment status from URL
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')

    if (paymentStatus) {
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      router.replace(url.pathname, { scroll: false })
    }
  }, [])

  // Data loading functions
  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadBillingData(),
        loadBillingHistory(),
        loadDashboardData(),
        loadSubscriptionData()
      ])
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionData = async () => {
    try {
      const response = await authenticatedFetch(`${AppConfig.app.baseUrl}/api/v1/payments/paddle/subscription/my-subscription`)

      if (!response.ok) return

      const result = await response.json()
      if (result.success && result.data) {
        setSubscriptionData(result.data as SubscriptionData)
      }
    } catch (error) {
      // Silently fail - subscription data is optional
    }
  }

  const loadBillingData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const response = await authenticatedFetch(BILLING_ENDPOINTS.OVERVIEW)

      if (!response.ok) throw new Error('Failed to load billing data')

      const result = await response.json()
      const data = result?.success === true && result.data ? result.data : result
      setBillingData(data)
    } catch (error) {
      handleApiError(error)
      setError(error instanceof Error ? error.message : 'Failed to load billing data')
    }
  }

  const loadDashboardData = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch packages from public endpoint
      const packagesResponse = await fetch(PUBLIC_ENDPOINTS.PACKAGES, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!packagesResponse.ok) throw new Error('Failed to load packages')

      const packagesResult = await packagesResponse.json()
      const packages = packagesResult?.data?.packages || []

      // Fetch dashboard data to get current package and usage data
      const dashboardResponse = await authenticatedFetch(`${AppConfig.app.baseUrl}/v1/dashboard`)

      if (!dashboardResponse.ok) throw new Error('Failed to load dashboard data')

      const dashboardResult = await dashboardResponse.json()
      const dashboardData = dashboardResult?.data || {}

      // Extract profile data from nested structure
      const profileData = dashboardData.user?.profile || {}
      const billingData = dashboardData.billing || {}

      // Set packages data
      setPackagesData({
        packages: packages,
        current_package_id: profileData.package_id || billingData.current_package_id || null,
        expires_at: profileData.expires_at || billingData.expires_at || null,
        user_currency: 'USD',
        user_country: billingData.user_country || profileData.country || ''
      })

      // Extract usage data from dashboard
      if (dashboardData.user?.quota) {
        setUsageData(dashboardData.user.quota)
      }

      // Extract keyword usage from rank tracking
      if (dashboardData.rankTracking?.usage) {
        setKeywordUsage(dashboardData.rankTracking.usage)
      }

      // Fetch total keywords count across all domains
      try {
        const keywordsResponse = await authenticatedFetch(`${AppConfig.app.baseUrl}/v1/rank-tracking/keywords`)

        if (keywordsResponse.ok) {
          const keywordsResult = await keywordsResponse.json()
          if (keywordsResult.success && keywordsResult.data) {
            // Count total active keywords across all domains
            const allKeywords: { is_active: boolean }[] = keywordsResult.data.keywords || []
            const activeKeywordsCount = allKeywords.filter((kw) => kw.is_active).length
            setTotalKeywords(activeKeywordsCount)
          }
        }
      } catch (err) {
        // Fallback to usage data if keywords endpoint fails
        setTotalKeywords(keywordUsage?.keywords_used || 0)
      }

      // Extract trial eligibility from dashboard
      if (dashboardData.user?.trial) {
        setTrialEligible(dashboardData.user.trial.eligible)
      }
    } catch (error) {
      handleApiError(error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    }
  }

  const loadBillingHistory = async (page: number = 1) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      const response = await authenticatedFetch(`${BILLING_ENDPOINTS.HISTORY}?${params}`)

      if (!response.ok) throw new Error('Failed to load billing history')

      const result = await response.json()
      const data = result?.success === true && result.data ? result.data : result
      setHistoryData(data)
      setCurrentPage(page)
    } catch (error) {
      handleApiError(error)
      setError(error instanceof Error ? error.message : 'Failed to load billing history')
    }
  }

  const handlePageChange = async (page: number) => {
    await loadBillingHistory(page)
  }

  // Helper functions
  const getUsagePercentage = (used: number, limit: number, isUnlimited: boolean) => {
    if (isUnlimited || limit <= 0) return 0
    return Math.min(100, (used / limit) * 100)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Action handlers
  const handleSubscribe = async (packageId: string, period: string) => {
    try {
      setSubscribing(packageId)
      window.location.href = buildCheckoutUrl(packageId, period)
    } catch (error) {
      handleApiError(error, { context: 'BillingPage.handleSubscribe', toastTitle: 'Subscription Error' })
    } finally {
      setSubscribing(null)
    }
  }

  const handleStartTrial = async (packageId: string) => {
    try {
      setStartingTrial(packageId)
      window.location.href = buildCheckoutUrl(packageId, 'monthly', true)
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error starting trial')
    } finally {
      setStartingTrial(null)
    }
  }

  const handleCancelSuccess = async () => {
    setShowCancelDialog(false)
    addToast({
      title: 'Subscription Canceled',
      description: 'Your subscription has been successfully canceled.'
    })
    // Reload subscription data
    await loadSubscriptionData()
    await loadBillingData()
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return <Check className="h-4 w-4 text-success" />
      case 'pending':
      case 'proof_uploaded':
        return <AlertCircle className="h-4 w-4 text-warning" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proof_uploaded':
        return 'WAITING FOR CONFIRMATION'
      default:
        return status.replace('_', ' ').toUpperCase()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'confirmed':
        return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
      case 'expired':
      case 'failed':
      case 'cancelled':
        return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' }
      case 'expiring_soon':
      case 'pending':
      case 'proof_uploaded':
        return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' }
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' }
    }
  }

  // Loading and error states
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
        <ErrorState
          title="Error Loading Billing Data"
          message={error}
          onRetry={loadAllData}
        />
      </div>
    )
  }

  const currentPlan = packagesData?.packages.find(pkg => pkg.id === packagesData.current_package_id)
  const currentUserBillingPeriod = billingData?.currentSubscription?.billing_period || 'monthly'
  const currentPlanPricing = currentPlan ? getBillingPeriodPrice(currentPlan, currentUserBillingPeriod) : null

  return (
    <div className="space-y-8">
      {/* Current Plan & Usage */}
      <BillingStats
        billingData={billingData}
        currentPackageId={packagesData?.current_package_id || null}
        formatCurrency={formatCurrency}
        keywordUsage={keywordUsage}
        usageLoading={loading}
        expirationText={billingData?.currentSubscription?.expires_at ? formatDate(billingData.currentSubscription.expires_at) : 'Active'}
      />

      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-heading-plans">Available Plans</h2>
          <div className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">Save 20% on Annual Plans</div>
        </div>

        <PricingCards
          packages={packagesData?.packages || []}
          selectedBillingPeriod={selectedBillingPeriod === 'yearly' ? 'annual' : 'monthly'}
          setSelectedBillingPeriod={(period: string) => setSelectedBillingPeriod(period === 'annual' ? 'yearly' : 'monthly')}
          subscribing={subscribing}
          trialEligible={trialEligible}
          startingTrial={startingTrial}
          showDetails={{}}
          showComparePlans={false}
          getBillingPeriodPrice={getBillingPeriodPrice}
          formatCurrency={formatCurrency}
          handleSubscribe={(pkgId: string) => handleSubscribe(pkgId, selectedBillingPeriod)}
          handleStartTrial={handleStartTrial}
          isTrialEligiblePackage={isTrialEligiblePackage}
          togglePlanDetails={() => { }}
        />
      </div>

      {/* Billing History Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <BillingHistory
            historyData={historyData}
            statusFilter=""
            typeFilter=""
            searchTerm=""
            setStatusFilter={() => { }}
            setTypeFilter={() => { }}
            setSearchTerm={() => { }}
            handlePageChange={handlePageChange}
            resetFilters={() => { }}
            getStatusIcon={getStatusIcon}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onRowClick={(id: string) => window.location.href = `/dashboard/settings/plans-billing/order/${id}`}
          />
        </div>
      </div>

      {/* Danger Zone Card - Cancel Subscription */}
      {subscriptionData?.hasSubscription && subscriptionData.subscription && (
        <div className="bg-white shadow-sm ring-1 ring-red-900/10 rounded-xl" data-testid="card-danger-zone">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your subscription cancellation.</p>
          </div>
          <div className="border-t border-gray-200 px-6 py-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Cancel Subscription</h3>
              <p className="text-sm text-gray-600">All services will be stopped at the end of your billing cycle.</p>
            </div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              data-testid="button-cancel-subscription"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && subscriptionData?.hasSubscription && subscriptionData.subscription?.paddle_subscription_id && (
        <CancelSubscriptionDialog
          subscriptionId={subscriptionData.subscription.paddle_subscription_id}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  )
}
