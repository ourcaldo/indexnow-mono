'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  X,
} from 'lucide-react'
import {
  API_BASE,
  BILLING_ENDPOINTS,
  PUBLIC_ENDPOINTS,
  formatCurrency,
  formatDate,
  logger,
} from '@indexnow/shared'
import { authService, authenticatedFetch } from '@indexnow/supabase-client'
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui/hooks'
import { useToast, useApiError } from '@indexnow/ui'

/* ───────────────────── Types ───────────────────── */

interface PricingTier {
  regular_price: number
  promo_price?: number
  discount_percentage?: number
  paddle_price_id?: string
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
  quota_limits: { rank_tracking_limit: number; concurrent_jobs_limit: number }
  is_popular: boolean
  is_current: boolean
  free_trial_enabled?: boolean
  pricing_tiers: Record<string, PricingTier>
}

interface Transaction {
  id: string
  transaction_type: string
  transaction_status: string
  amount: number
  currency: string
  payment_method: string
  created_at: string
  package_name?: string
  package?: { name: string; slug: string }
}

interface BillingHistoryData {
  transactions: Transaction[]
  summary: {
    total_transactions: number
    completed_transactions: number
    pending_transactions: number
    failed_transactions: number
    total_amount_spent: number
  }
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next: boolean
    has_prev: boolean
  }
}

interface BillingData {
  currentSubscription: {
    package_name: string
    package_slug: string
    subscription_status: string
    expires_at: string | null
    subscribed_at: string | null
    amount_paid: number
    billing_period: string
  } | null
  billingStats: {
    total_payments: number
    total_spent: number
    next_billing_date: string | null
    days_remaining: number | null
  }
}

interface KeywordUsageData {
  keywords_used: number
  keywords_limit: number
  is_unlimited: boolean
  remaining_quota: number
}

interface PackagesData {
  packages: PaymentPackage[]
  current_package_id: string | null
  expires_at: string | null
}

interface SubscriptionData {
  hasSubscription: boolean
  subscription?: {
    paddle_subscription_id: string
    status: string
    expires_at: string
    package_id: string
  }
}

/* ───────────────────── Helpers ───────────────────── */

function getPricing(pkg: PaymentPackage, period: string) {
  const key = period === 'yearly' ? 'annual' : period
  const tier = pkg.pricing_tiers?.[key]
  if (!tier) return { price: pkg.price ?? 0 }
  const price = tier.promo_price || tier.regular_price
  const orig =
    tier.promo_price && tier.promo_price < tier.regular_price ? tier.regular_price : undefined
  const disc = orig ? Math.round(((orig - price) / orig) * 100) : tier.discount_percentage
  return { price, originalPrice: orig, discount: disc && disc > 0 ? disc : undefined }
}

function checkoutUrl(pkgId: string, period: string, trial = false) {
  const base = `/settings/plans-billing/checkout?package=${pkgId}&period=${period}`
  return trial ? `${base}&trial=true` : base
}

function statusDot(status: string) {
  switch (status) {
    case 'active':
    case 'completed':
    case 'confirmed':
      return 'bg-emerald-500'
    case 'expired':
    case 'failed':
    case 'cancelled':
      return 'bg-red-500'
    case 'pending':
    case 'proof_uploaded':
    case 'expiring_soon':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

function statusLabel(status: string) {
  if (status === 'proof_uploaded') return 'Awaiting confirmation'
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function usagePct(used: number, limit: number, unlimited: boolean) {
  if (unlimited || limit <= 0) return 0
  return Math.min(100, (used / limit) * 100)
}

/* ═══════════════════════ Component ═══════════════════════ */

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [packagesData, setPackagesData] = useState<PackagesData | null>(null)
  const [historyData, setHistoryData] = useState<BillingHistoryData | null>(null)
  const [keywordUsage, setKeywordUsage] = useState<KeywordUsageData | null>(null)
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [startingTrial, setStartingTrial] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const { addToast } = useToast()
  const { handleApiError } = useApiError()
  const { logBillingActivity } = useActivityLogger()
  usePageViewLogger('/settings/plans-billing', 'Billing & Subscriptions', { section: 'billing_management' })

  /* ── Data loading ── */

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([loadBillingData(), loadBillingHistory(), loadDashboardData(), loadSubscriptionData()])
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleApiError])

  useEffect(() => {
    loadAllData()
    const p = new URLSearchParams(window.location.search).get('payment')
    if (p) {
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      router.replace(url.pathname, { scroll: false })
    }
  }, [loadAllData, router])

  async function loadSubscriptionData() {
    try {
      const res = await authenticatedFetch(`${API_BASE.V1}/payments/paddle/subscription/my-subscription`)
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data) setSubscriptionData(json.data)
    } catch { /* optional */ }
  }

  async function loadBillingData() {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      const res = await authenticatedFetch(BILLING_ENDPOINTS.OVERVIEW)
      if (!res.ok) throw new Error('Failed to load billing data')
      const json = await res.json()
      setBillingData(json?.success ? json.data : json)
    } catch (err) {
      handleApiError(err)
      setError(err instanceof Error ? err.message : 'Failed to load billing data')
    }
  }

  async function loadDashboardData() {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const [pkgRes, dashRes] = await Promise.all([
        fetch(PUBLIC_ENDPOINTS.SETTINGS, { headers: { 'Content-Type': 'application/json' } }),
        authenticatedFetch(`${API_BASE.V1}/dashboard`),
      ])

      if (!pkgRes.ok) throw new Error('Failed to load packages')
      if (!dashRes.ok) throw new Error('Failed to load dashboard')

      const pkgJson = await pkgRes.json()
      const settingsData = pkgJson?.success ? pkgJson.data : pkgJson
      const packages: PaymentPackage[] = settingsData?.packages?.packages || []

      const dashJson = await dashRes.json()
      const d = dashJson?.data || {}
      const profile = d.user?.profile || {}
      const billing = d.billing || {}

      setPackagesData({
        packages,
        current_package_id: profile.package_id || billing.current_package_id || null,
        expires_at: profile.expires_at || billing.expires_at || null,
      })

      if (d.user?.quota) setKeywordUsage(d.user.quota as KeywordUsageData)
      if (d.user?.trial) setTrialEligible(d.user.trial.eligible)
    } catch (err) {
      handleApiError(err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    }
  }

  async function loadBillingHistory(page = 1) {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      const params = new URLSearchParams({ page: page.toString(), limit: itemsPerPage.toString() })
      const res = await authenticatedFetch(`${BILLING_ENDPOINTS.HISTORY}?${params}`)
      if (!res.ok) throw new Error('Failed to load billing history')
      const json = await res.json()
      setHistoryData(json?.success ? json.data : json)
      setCurrentPage(page)
    } catch (err) {
      handleApiError(err)
      setError(err instanceof Error ? err.message : 'Failed to load billing history')
    }
  }

  /* ── Actions ── */

  const handleSubscribe = (pkgId: string) => {
    setSubscribing(pkgId)
    window.location.href = checkoutUrl(pkgId, billingPeriod)
  }

  const handleStartTrial = (pkgId: string) => {
    setStartingTrial(pkgId)
    window.location.href = checkoutUrl(pkgId, 'monthly', true)
  }

  const handleCancelSuccess = async () => {
    setShowCancelDialog(false)
    addToast({ title: 'Subscription Canceled', description: 'Your subscription has been successfully canceled.' })
    await loadSubscriptionData()
    await loadBillingData()
  }

  /* ── Loading ── */

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800/50" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded bg-gray-100 dark:bg-gray-800/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <AlertCircle className="inline w-4 h-4 mr-1.5 -mt-0.5 text-red-500" />
          {error}
        </p>
        <button onClick={loadAllData} className="mt-3 text-sm text-gray-900 dark:text-white underline underline-offset-2 hover:no-underline">
          Retry
        </button>
      </div>
    )
  }

  const sub = billingData?.currentSubscription
  const stats = billingData?.billingStats
  const packages = packagesData?.packages || []
  const currentPkgId = packagesData?.current_package_id
  const pct = keywordUsage ? usagePct(keywordUsage.keywords_used, keywordUsage.keywords_limit, keywordUsage.is_unlimited) : 0

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="space-y-10">

      {/* ── Current plan ── */}
      {sub ? (
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{sub.package_name}</h2>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot(sub.subscription_status)}`} />
                  {statusLabel(sub.subscription_status)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(sub.amount_paid)}/{sub.billing_period}
                {sub.expires_at && <> &middot; Renews {formatDate(sub.expires_at)}</>}
                {stats?.days_remaining != null && <> &middot; {stats.days_remaining} days left</>}
              </p>
            </div>
            {subscriptionData?.hasSubscription && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Usage bar */}
          {keywordUsage && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">Keywords</span>
                <span className="text-gray-900 dark:text-white font-medium tabular-nums">
                  {keywordUsage.keywords_used}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">
                    {' / '}{keywordUsage.is_unlimited ? '∞' : (keywordUsage.keywords_limit ?? 0).toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No active plan. Choose one below to start tracking keywords.
        </p>
      )}

      {/* ── Plans ── */}
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="text-xs text-gray-400 dark:text-gray-500">Plans</h3>
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-2 py-0.5 rounded transition-colors ${
                billingPeriod === 'monthly'
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-2 py-0.5 rounded transition-colors ${
                billingPeriod === 'yearly'
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Annual{billingPeriod !== 'yearly' ? ' (save 20%)' : ''}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {packages.map((pkg) => {
            const isCurrent = pkg.is_current || pkg.id === currentPkgId
            const pricing = getPricing(pkg, billingPeriod)
            const trialOk = trialEligible && pkg.free_trial_enabled
            const isExpanded = expandedPlan === pkg.id

            return (
              <div key={pkg.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  {/* Name + desc */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                      {isCurrent && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{pkg.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline gap-1 justify-end">
                      {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                        <span className="text-xs line-through text-gray-300 dark:text-gray-600">{formatCurrency(pricing.originalPrice)}</span>
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(pricing.price)}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">/mo</span>
                    </div>
                    {pricing.discount && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">save {pricing.discount}%</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <button
                        onClick={() => handleSubscribe(pkg.id)}
                        disabled={subscribing === pkg.id}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {subscribing === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Select'}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPlan(isExpanded ? null : pkg.id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded features */}
                {isExpanded && (
                  <div className="mt-3 pl-0 grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{f}</span>
                      </div>
                    ))}
                    {trialOk && !isCurrent && (
                      <div className="col-span-2 mt-2">
                        <button
                          onClick={() => handleStartTrial(pkg.id)}
                          disabled={startingTrial === pkg.id}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                        >
                          {startingTrial === pkg.id ? 'Starting...' : 'Start free 3-day trial →'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Transactions ── */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-xs text-gray-400 dark:text-gray-500">Transactions</h3>
          {historyData?.summary && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {historyData.summary.total_transactions} payments &middot; {formatCurrency(historyData.summary.total_amount_spent)} total
            </span>
          )}
        </div>

        {historyData?.transactions && historyData.transactions.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {historyData.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {tx.package?.name || tx.package_name || 'Payment'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                      {tx.transaction_type.replace('_', ' ')} &middot; {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot(tx.transaction_status)}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {historyData.pagination && historyData.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, historyData.pagination.total_items)} of {historyData.pagination.total_items}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => loadBillingHistory(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadBillingHistory(Math.min(currentPage + 1, historyData.pagination.total_pages))}
                    disabled={currentPage === historyData.pagination.total_pages}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-4">No transactions yet.</p>
        )}
      </div>

      {/* ── Cancel dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCancelDialog(false)} />
          <div className="relative bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 max-w-sm w-full mx-4 p-6">
            <button onClick={() => setShowCancelDialog(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cancel subscription?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your plan stays active until the current billing cycle ends. After that you lose access to paid features.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancelSuccess}
                className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
