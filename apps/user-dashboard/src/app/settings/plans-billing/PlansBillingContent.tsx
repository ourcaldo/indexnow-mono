'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
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

/* ───────────────────── Types (local) ───────────────────── */

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

function statusColor(status: string) {
  switch (status) {
    case 'active':
    case 'completed':
    case 'confirmed':
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' }
    case 'expired':
    case 'failed':
    case 'cancelled':
      return { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
    case 'pending':
    case 'proof_uploaded':
    case 'expiring_soon':
      return { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }
    default:
      return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
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

/* ───────────────────── Component ───────────────────── */

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

  /* ── Loading / Error ── */

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white dark:bg-[#141520] p-6 border border-gray-200 dark:border-gray-800">
            <div className="mb-4 h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-3">
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-10 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 p-10 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Error Loading Billing</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={loadAllData} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  const sub = billingData?.currentSubscription
  const packages = packagesData?.packages || []
  const currentPkgId = packagesData?.current_package_id

  /* ─────────────── RENDER ─────────────── */

  return (
    <div className="space-y-8">
      {/* ── Current Plan & Usage ── */}
      {!currentPkgId && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">No Active Package</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Subscribe to a plan below to start tracking keywords.</p>
          </div>
        </div>
      )}

      {sub && (
        <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Plan</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{sub.package_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {sub.expires_at ? `Expires ${formatDate(sub.expires_at)}` : 'Active'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment</span>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(sub.amount_paid)}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">per {sub.billing_period}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                <div className="mt-1">
                  {(() => {
                    const sc = statusColor(sub.subscription_status)
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                        {sub.subscription_status === 'active' && <Check className="w-3 h-3" />}
                        {statusLabel(sub.subscription_status)}
                      </span>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Usage bar */}
            {keywordUsage && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords tracked</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {keywordUsage.keywords_used} / {keywordUsage.is_unlimited ? '∞' : keywordUsage.keywords_limit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${usagePct(keywordUsage.keywords_used, keywordUsage.keywords_limit, keywordUsage.is_unlimited)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Available Plans ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Plans</h2>
          {/* Billing period toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod((p) => (p === 'monthly' ? 'yearly' : 'monthly'))}
              className={`relative w-10 h-[22px] rounded-full transition-colors ${billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${billingPeriod === 'yearly' ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Annual</span>
            {billingPeriod === 'yearly' && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Save 20%</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const isCurrent = pkg.is_current || pkg.id === currentPkgId
            const pricing = getPricing(pkg, billingPeriod)
            const trialOk = trialEligible && pkg.free_trial_enabled

            return (
              <div
                key={pkg.id}
                className={`rounded-xl border p-5 flex flex-col transition-colors ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-[#141520] border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                } ${pkg.is_popular && !isCurrent ? 'ring-2 ring-blue-500/30' : ''}`}
              >
                {pkg.is_popular && !isCurrent && (
                  <span className="inline-block mb-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Most Popular</span>
                )}

                <h3 className={`font-semibold ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{pkg.name}</h3>
                <p className={`text-sm mt-1 mb-4 ${isCurrent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{pkg.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                      <span className={`text-sm line-through ${isCurrent ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatCurrency(pricing.originalPrice)}
                      </span>
                    )}
                    <span className={`text-2xl font-bold ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {formatCurrency(pricing.price)}
                    </span>
                    <span className={`text-sm ${isCurrent ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>/mo</span>
                  </div>
                  {pricing.discount && (
                    <span className="text-xs font-medium text-emerald-500">Save {pricing.discount}%</span>
                  )}
                </div>

                {/* Features */}
                <ul className={`space-y-2 mb-5 flex-1 ${isCurrent ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isCurrent ? 'text-blue-200' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                {isCurrent ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-blue-200">
                    <Check className="w-4 h-4" /> Current Plan
                  </div>
                ) : (
                  <div className="space-y-2 mt-auto">
                    {trialOk && (
                      <button
                        onClick={() => handleStartTrial(pkg.id)}
                        disabled={startingTrial === pkg.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {startingTrial === pkg.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                        ) : (
                          <><Clock className="w-4 h-4" /> Start 3-Day Trial</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleSubscribe(pkg.id)}
                      disabled={subscribing === pkg.id}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        trialOk
                          ? 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {subscribing === pkg.id ? (
                        <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</span>
                      ) : (
                        'Switch plan'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Billing History ── */}
      <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Billing History</h2>
          {historyData?.summary && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {historyData.summary.total_transactions} transactions · {formatCurrency(historyData.summary.total_amount_spent)} total spent
            </p>
          )}
        </div>

        {historyData?.transactions && historyData.transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {historyData.transactions.map((tx) => {
                    const sc = statusColor(tx.transaction_status)
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{tx.package?.name || tx.package_name || '—'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{tx.transaction_type.replace('_', ' ')}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {statusLabel(tx.transaction_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyData.pagination && historyData.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {historyData.pagination.current_page} of {historyData.pagination.total_pages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadBillingHistory(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadBillingHistory(Math.min(currentPage + 1, historyData.pagination.total_pages))}
                    disabled={currentPage === historyData.pagination.total_pages}
                    className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No transactions yet</p>
          </div>
        )}
      </div>

      {/* ── Danger Zone ── */}
      {subscriptionData?.hasSubscription && subscriptionData.subscription && (
        <div className="rounded-xl bg-white dark:bg-[#141520] border border-red-200 dark:border-red-900/40">
          <div className="px-6 py-5">
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage subscription cancellation.</p>
          </div>
          <div className="flex items-center justify-between px-6 py-5 border-t border-red-100 dark:border-red-900/30">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Cancel Subscription</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Services stop at the end of the billing cycle.</p>
            </div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelDialog(false)} />
          <div className="relative bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full mx-4 p-6">
            <button onClick={() => setShowCancelDialog(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cancel Subscription</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your subscription will be canceled at the end of the current billing period. You can continue using services until then.
            </p>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 mb-6">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-medium">Note:</span> This action cannot be undone. You can always subscribe again later.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelDialog(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Go Back
              </button>
              <button onClick={handleCancelSuccess} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
