'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  Loader2,
  Receipt,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { formatCurrency } from '@indexnow/shared'
import { fmtDate } from '../../../lib/utils'
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui/hooks'
import { useToast, useApiError } from '@indexnow/ui'
import {
  useBillingOverview,
  useBillingHistory,
  useDashboardAggregate,
  usePublicSettings,
  useSubscription,
} from '../../../lib/hooks'

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
  features: string[]
  quota_limits: { max_keywords?: number; max_domains?: number }
  is_popular: boolean
  is_current: boolean
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

interface QuotaEntry {
  used: number
  limit: number
  is_unlimited: boolean
  remaining: number
}

interface KeywordUsageData {
  keywords: QuotaEntry
  domains: QuotaEntry
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

function statusColor(status: string) {
  switch (status) {
    case 'active':
    case 'completed':
    case 'confirmed':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' }
    case 'expired':
    case 'failed':
    case 'cancelled':
      return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', text: 'text-red-600 dark:text-red-400' }
    case 'pending':
    case 'proof_uploaded':
    case 'expiring_soon':
      return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400' }
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', text: 'text-gray-500 dark:text-gray-400' }
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

function usageBarColor(pct: number) {
  if (pct > 85) return 'bg-red-500'
  if (pct > 60) return 'bg-amber-500'
  return 'bg-blue-600'
}

/* ═══════════════════════ Component ═══════════════════════ */

function getPricing(pkg: PaymentPackage, period: string) {
  const key = period === 'yearly' ? 'annual' : period
  const tier = pkg.pricing_tiers?.[key]
  if (!tier) return { price: 0 }
  const price = tier.promo_price || tier.regular_price
  const orig =
    tier.promo_price && tier.promo_price < tier.regular_price ? tier.regular_price : undefined
  const disc = orig ? Math.round(((orig - price) / orig) * 100) : tier.discount_percentage
  return { price, originalPrice: orig, discount: disc && disc > 0 ? disc : undefined }
}

export default function BillingPage() {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [planPickerPeriod, setPlanPickerPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const { handleApiError } = useApiError()
  const { logBillingActivity } = useActivityLogger()
  usePageViewLogger('/settings/billing', 'Billing & Subscriptions', { section: 'billing_management' })

  /* ── Data ── */

  const { data: billingData, isLoading: billingLoading, error: billingError } = useBillingOverview()
  const { data: historyData, isLoading: historyLoading } = useBillingHistory(currentPage, itemsPerPage)
  const { data: dashboardData, isLoading: dashLoading } = useDashboardAggregate()
  const { data: publicSettings, isLoading: pkgLoading } = usePublicSettings()
  const { data: subscriptionData } = useSubscription()

  const packages: PaymentPackage[] =
    (publicSettings as unknown as { packages?: { packages?: PaymentPackage[] } })?.packages?.packages || []
  const dashProfile = dashboardData?.user?.profile as Record<string, unknown> | undefined
  const dashBilling = dashboardData?.billing as { current_package_id?: string } | undefined
  const currentPkgId = (dashProfile?.package_id as string) || dashBilling?.current_package_id || null
  const keywordUsage = dashboardData?.user?.quota as KeywordUsageData | undefined
  const loading = billingLoading || historyLoading || dashLoading || pkgLoading
  const error = billingError
    ? (billingError instanceof Error ? billingError.message : 'Failed to load billing data')
    : null

  // Handle ?payment= URL param cleanup
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('payment')
    if (p) {
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      router.replace(url.pathname, { scroll: false })
    }
  }, [router])

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-overview'] })
    queryClient.invalidateQueries({ queryKey: ['billing-history'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-aggregate'] })
    queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    queryClient.invalidateQueries({ queryKey: ['subscription'] })
  }

  /* ── Cancel subscription ── */

  const [cancelLoading, setCancelLoading] = useState(false)

  const handleCancelSubscription = async () => {
    const paddleSubId = subscriptionData?.subscription?.paddle_subscription_id
    if (!paddleSubId) {
      addToast({ title: 'Error', description: 'No active subscription found to cancel.' })
      return
    }

    setCancelLoading(true)
    try {
      const res = await fetch('/api/v1/payments/paddle/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: paddleSubId }),
      })

      const result = await res.json()

      if (!res.ok) {
        const msg = result?.error?.message || result?.message || 'Failed to cancel subscription'
        handleApiError(new Error(msg))
        return
      }

      setShowCancelDialog(false)
      const isImmediate = result?.data?.action === 'immediate_cancellation'
      addToast({
        title: 'Subscription Canceled',
        description: isImmediate
          ? 'Your subscription has been canceled and a refund is being processed.'
          : 'Your subscription will be canceled at the end of the current billing period.',
      })
      logBillingActivity('subscription_cancel', `Canceled subscription ${paddleSubId}`, { subscriptionId: paddleSubId, action: result?.data?.action })
      refetchAll()
    } catch (err) {
      handleApiError(err instanceof Error ? err : new Error('Failed to cancel subscription'))
    } finally {
      setCancelLoading(false)
    }
  }

  /* ── Loading skeleton ── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-72 rounded bg-gray-100 dark:bg-gray-800/50 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 rounded-xl bg-gray-100 dark:bg-gray-800/50" />
          <div className="h-44 rounded-xl bg-gray-100 dark:bg-gray-800/50" />
        </div>
        <div className="animate-pulse space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">{error}</p>
        <button
          onClick={refetchAll}
          className="mt-4 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  const sub = billingData?.currentSubscription ?? null
  const stats = billingData?.billingStats ?? null
  const kwPct = keywordUsage ? usagePct(keywordUsage.keywords.used, keywordUsage.keywords.limit, keywordUsage.keywords.is_unlimited) : 0
  const domPct = keywordUsage ? usagePct(keywordUsage.domains.used, keywordUsage.domains.limit, keywordUsage.domains.is_unlimited) : 0

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Plans & Billing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your subscription, view payment history, and update your billing details.
        </p>
      </div>

      {/* ── Current Plan + Usage row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Current Plan Card */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Current Plan
            </h2>
            {sub && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(sub.subscription_status).badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusColor(sub.subscription_status).dot}`} />
                {statusLabel(sub.subscription_status)}
              </span>
            )}
          </div>

          {sub ? (
            <div className="space-y-4">
              {/* Plan name + price */}
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{sub.package_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {sub.billing_period === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(sub.amount_paid)}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    /{sub.billing_period === 'monthly' ? 'month' : 'year'}
                  </p>
                </div>
              </div>

              {/* Billing info pills */}
              <div className="flex flex-wrap gap-3 text-sm">
                {sub.expires_at && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Renews {fmtDate(sub.expires_at)}</span>
                  </div>
                )}
                {stats?.days_remaining != null && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{stats.days_remaining} days left</span>
                  </div>
                )}
                {stats?.total_payments != null && stats.total_payments > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{stats.total_payments} payments</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowPlanPicker(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Plan
                </button>
                {subscriptionData?.hasSubscription && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 mb-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No active plan</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Get started with a plan to unlock keyword tracking and SEO insights.
              </p>
              <button
                onClick={() => setShowPlanPicker(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Choose a Plan
              </button>
            </div>
          )}
        </div>

        {/* Usage Summary Card */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-5">
            Usage Summary
          </h2>

          {keywordUsage ? (
            <div className="space-y-6">
              {/* Keywords usage */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</span>
                  <span className="text-sm tabular-nums text-gray-900 dark:text-white font-semibold">
                    {keywordUsage.keywords.used.toLocaleString()}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">
                      {' / '}{keywordUsage.keywords.is_unlimited ? '∞' : keywordUsage.keywords.limit.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${usageBarColor(kwPct)}`}
                    style={{ width: keywordUsage.keywords.is_unlimited ? '5%' : `${Math.max(kwPct, 2)}%` }}
                  />
                </div>
                {kwPct > 85 && !keywordUsage.keywords.is_unlimited && (
                  <p className="text-xs text-red-500 mt-1.5">Nearing limit — consider upgrading</p>
                )}
              </div>

              {/* Domains usage */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Domains</span>
                  <span className="text-sm tabular-nums text-gray-900 dark:text-white font-semibold">
                    {keywordUsage.domains.used.toLocaleString()}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">
                      {' / '}{keywordUsage.domains.is_unlimited ? '∞' : keywordUsage.domains.limit.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${usageBarColor(domPct)}`}
                    style={{ width: keywordUsage.domains.is_unlimited ? '5%' : `${Math.max(domPct, 2)}%` }}
                  />
                </div>
                {domPct > 85 && !keywordUsage.domains.is_unlimited && (
                  <p className="text-xs text-red-500 mt-1.5">Nearing limit — consider upgrading</p>
                )}
              </div>

              {/* Quick stats */}
              {stats && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total spent</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(stats.total_spent)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No usage data available</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Billing History ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Billing History</h2>
          {historyData?.summary && historyData.summary.total_transactions > 0 && (
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
              {historyData.summary.total_transactions} payment{historyData.summary.total_transactions !== 1 ? 's' : ''} &middot; {formatCurrency(historyData.summary.total_amount_spent)} total
            </span>
          )}
        </div>

        {historyData?.transactions && historyData.transactions.length > 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <span className="col-span-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</span>
              <span className="col-span-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</span>
              <span className="col-span-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
              <span className="col-span-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {historyData.transactions.map((tx) => {
                const sc = statusColor(tx.transaction_status)
                return (
                  <div key={tx.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    {/* Date */}
                    <div className="sm:col-span-3">
                      <p className="text-sm text-gray-900 dark:text-white">{fmtDate(tx.created_at)}</p>
                    </div>
                    {/* Description */}
                    <div className="sm:col-span-4">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {tx.package?.name || tx.package_name || 'Payment'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
                        {tx.transaction_type.replace('_', ' ')}
                      </p>
                    </div>
                    {/* Status */}
                    <div className="sm:col-span-2 flex items-start">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {statusLabel(tx.transaction_status)}
                      </span>
                    </div>
                    {/* Amount */}
                    <div className="sm:col-span-3 text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {historyData.pagination && historyData.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {historyData.pagination.total_pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, historyData.pagination.total_pages))}
                    disabled={currentPage === historyData.pagination.total_pages}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your billing history will appear here once you make a payment.</p>
          </div>
        )}
      </div>

      {/* ── Payment method info ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Method</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Payments are handled securely by Paddle
            </p>
          </div>
        </div>
      </div>

      {/* ── Plan Picker Modal ── */}
      {showPlanPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanPicker(false)} />
          <div className="relative bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full mx-4 p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowPlanPicker(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a plan to continue to checkout.</p>

            {/* Period toggle */}
            <div className="flex items-center gap-1 mt-4 mb-5 text-sm">
              <button
                onClick={() => setPlanPickerPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  planPickerPeriod === 'monthly'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlanPickerPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  planPickerPeriod === 'yearly'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Annual
              </button>
            </div>

            {/* Plans list */}
            <div className="space-y-2">
              {packages.map((pkg) => {
                const isCurrent = pkg.is_current || pkg.id === currentPkgId
                const pricing = getPricing(pkg, planPickerPeriod)

                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      if (!isCurrent) {
                        setShowPlanPicker(false)
                        router.push(`/settings/billing/checkout?package=${pkg.id}&period=${planPickerPeriod}`)
                      }
                    }}
                    disabled={isCurrent}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      isCurrent
                        ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 cursor-default'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{pkg.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                              <Check className="h-3 w-3" /> Current
                            </span>
                          )}
                          {pkg.is_popular && !isCurrent && (
                            <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pkg.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {pkg.quota_limits.max_keywords === -1 ? 'Unlimited' : pkg.quota_limits.max_keywords} keywords &middot; {pkg.quota_limits.max_domains === -1 ? 'Unlimited' : pkg.quota_limits.max_domains} domains
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="flex items-baseline gap-1 justify-end">
                          {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                            <span className="text-xs line-through text-gray-300 dark:text-gray-600">{formatCurrency(pricing.originalPrice)}</span>
                          )}
                          <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(pricing.price)}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">/{planPickerPeriod === 'yearly' ? 'year' : 'month'}</span>
                        {pricing.discount && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">save {pricing.discount}%</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {packages.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No plans available.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelDialog(false)} />
          <div className="relative bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 max-w-md w-full mx-4 p-6 shadow-xl">
            <button onClick={() => setShowCancelDialog(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel subscription?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Your plan will stay active until the end of the current billing cycle. After that, you&apos;ll lose access to paid features and your tracked data.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cancelLoading ? 'Canceling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
