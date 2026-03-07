'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { formatCurrency, PAYMENT_ENDPOINTS, type PublicSettingsPackage, type DashboardPackagePricingTier } from '@indexnow/shared'
import {
  cancelSubscriptionResponseSchema,
  changePlanResponseSchema,
  customerPortalResponseSchema,
} from '@indexnow/shared/response-schemas'
import { fmtDate } from '../../../lib/utils'
import { api } from '../../../lib/api'
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
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600' }
    case 'expired':
    case 'failed':
    case 'cancelled':
      return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', text: 'text-red-600' }
    case 'pending':
    case 'proof_uploaded':
    case 'expiring_soon':
      return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', text: 'text-amber-600' }
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-500' }
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
  return 'bg-accent'
}

/* ═══════════════════════ Component ═══════════════════════ */

function getPricing(pkg: PublicSettingsPackage, period: string) {
  const key = period === 'yearly' ? 'annual' : period
  const tier: DashboardPackagePricingTier | undefined = pkg.pricing_tiers?.[key]
  if (!tier) return { price: 0 }
  const price = tier.promo_price || tier.regular_price
  const orig =
    tier.promo_price && tier.promo_price < tier.regular_price ? tier.regular_price : undefined
  const disc = orig ? Math.round(((orig - price) / orig) * 100) : undefined
  return { price, originalPrice: orig, discount: disc && disc > 0 ? disc : undefined }
}

export default function BillingPage() {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [planPickerPeriod, setPlanPickerPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [currentPage, setCurrentPage] = useState(1)
  const [planChangeLoading, setPlanChangeLoading] = useState(false)
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

  const packages = publicSettings?.packages?.packages ?? []
  const currentPkgId = dashboardData?.user?.profile?.package_id ?? dashboardData?.billing?.current_package_id ?? null
  const keywordUsage = dashboardData?.user?.quota
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
      const result = await api<{ action: string }>(PAYMENT_ENDPOINTS.SUBSCRIPTION_CANCEL, {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: paddleSubId }),
        schema: cancelSubscriptionResponseSchema,
      })

      setShowCancelDialog(false)
      const isImmediate = result?.action === 'immediate_cancellation'
      addToast({
        title: 'Subscription Canceled',
        description: isImmediate
          ? 'Your subscription has been canceled and a refund is being processed.'
          : 'Your subscription will be canceled at the end of the current billing period.',
      })
      logBillingActivity('subscription_cancel', `Canceled subscription ${paddleSubId}`, { subscriptionId: paddleSubId, action: result?.action })
      refetchAll()
    } catch (err) {
      handleApiError(err instanceof Error ? err : new Error('Failed to cancel subscription'))
    } finally {
      setCancelLoading(false)
    }
  }

  /* ── Change plan (upgrade/downgrade via Paddle API) ── */

  const handleChangePlan = async (pkg: PublicSettingsPackage) => {
    const paddleSubId = subscriptionData?.subscription?.paddle_subscription_id
    if (!paddleSubId) {
      addToast({ title: 'Error', description: 'No active subscription found.' })
      return
    }

    const tierKey = planPickerPeriod === 'yearly' ? 'annual' : planPickerPeriod
    const tier = pkg.pricing_tiers?.[tierKey]
    const paddlePriceId = tier?.paddle_price_id

    if (!paddlePriceId) {
      addToast({ title: 'Error', description: 'Price not available for the selected plan and billing period.' })
      return
    }

    setPlanChangeLoading(true)
    try {
      await api<{ subscription: { id: string; status: string }; message: string }>(
        PAYMENT_ENDPOINTS.SUBSCRIPTION_UPDATE,
        {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: paddleSubId,
            newPriceId: paddlePriceId,
          }),
          schema: changePlanResponseSchema,
        }
      )

      setShowPlanPicker(false)
      addToast({
        title: 'Plan Updated',
        description: `Your plan has been changed to ${pkg.name}. Changes will be reflected shortly.`,
      })
      logBillingActivity('subscription_plan_change', `Changed plan to ${pkg.name}`, {
        subscriptionId: paddleSubId,
        newPackageId: pkg.id,
        newPriceId: paddlePriceId,
        billingPeriod: planPickerPeriod,
      })
      refetchAll()
    } catch (err) {
      handleApiError(err instanceof Error ? err : new Error('Failed to change plan'))
    } finally {
      setPlanChangeLoading(false)
    }
  }

  /* ── Manage Billing (Paddle customer portal) ── */

  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const result = await api<{ portalUrl: string }>(PAYMENT_ENDPOINTS.CUSTOMER_PORTAL, { schema: customerPortalResponseSchema })
      if (result?.portalUrl) {
        window.open(result.portalUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      handleApiError(err instanceof Error ? err : new Error('Failed to open billing portal'))
    } finally {
      setPortalLoading(false)
    }
  }

  /* ── Loading skeleton ── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-3 w-72 rounded bg-gray-100 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 rounded-xl bg-gray-100" />
          <div className="h-44 rounded-xl bg-gray-100" />
        </div>
        <div className="animate-pulse space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-gray-600 max-w-sm">{error}</p>
        <button
          onClick={refetchAll}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
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
        <h1 className="text-xl font-semibold text-gray-900">Plans & Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription, view payment history, and update your billing details.
        </p>
      </div>

      {/* ── Current Plan + Usage row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Current Plan Card */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                  <h3 className="text-2xl font-bold text-gray-900">{sub.package_name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {sub.billing_period === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {formatCurrency(sub.amount_paid)}
                  </p>
                  <p className="text-sm text-gray-400">
                    /{sub.billing_period === 'monthly' ? 'month' : 'year'}
                  </p>
                </div>
              </div>

              {/* Billing info pills */}
              <div className="flex flex-wrap gap-3 text-sm">
                {sub.expires_at && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Renews {fmtDate(sub.expires_at)}</span>
                  </div>
                )}
                {stats?.days_remaining != null && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{stats.days_remaining} days left</span>
                  </div>
                )}
                {stats?.total_payments != null && stats.total_payments > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{stats.total_payments} payments</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowPlanPicker(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Change Plan
                </button>
                {subscriptionData?.hasSubscription && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No active plan</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Get started with a plan to unlock keyword tracking and SEO insights.
              </p>
              <button
                onClick={() => setShowPlanPicker(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Choose a Plan
              </button>
            </div>
          )}
        </div>

        {/* Usage Summary Card */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">
            Usage Summary
          </h2>

          {keywordUsage ? (
            <div className="space-y-6">
              {/* Keywords usage */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Keywords</span>
                  <span className="text-sm tabular-nums text-gray-900 font-semibold">
                    {keywordUsage.keywords.used.toLocaleString()}
                    <span className="text-gray-400 font-normal">
                      {' / '}{keywordUsage.keywords.is_unlimited ? '∞' : keywordUsage.keywords.limit.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
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
                  <span className="text-sm font-medium text-gray-700">Domains</span>
                  <span className="text-sm tabular-nums text-gray-900 font-semibold">
                    {keywordUsage.domains.used.toLocaleString()}
                    <span className="text-gray-400 font-normal">
                      {' / '}{keywordUsage.domains.is_unlimited ? '∞' : keywordUsage.domains.limit.toLocaleString()}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
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
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total spent</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(stats.total_spent)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-400">No usage data available</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Billing History ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Billing History</h2>
          {historyData?.summary && historyData.summary.total_transactions > 0 && (
            <span className="text-sm text-gray-400 tabular-nums">
              {historyData.summary.total_transactions} payment{historyData.summary.total_transactions !== 1 ? 's' : ''} &middot; {formatCurrency(historyData.summary.total_amount_spent)} total
            </span>
          )}
        </div>

        {historyData?.transactions && historyData.transactions.length > 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</span>
              <span className="col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</span>
              <span className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
              <span className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amount</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {historyData.transactions.map((tx) => {
                const sc = statusColor(tx.transaction_status)
                return (
                  <div key={tx.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    {/* Date */}
                    <div className="sm:col-span-3">
                      <p className="text-sm text-gray-900">{fmtDate(tx.created_at)}</p>
                    </div>
                    {/* Description */}
                    <div className="sm:col-span-4">
                      <p className="text-sm text-gray-900 font-medium">
                        {tx.package?.name || tx.package_name || 'Payment'}
                      </p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">
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
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {historyData.pagination && historyData.pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {historyData.pagination.total_pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, historyData.pagination.total_pages))}
                    disabled={currentPage === historyData.pagination.total_pages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your billing history will appear here once you make a payment.</p>
          </div>
        )}
      </div>

      {/* ── Payment method info ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payment Method</p>
              <p className="text-xs text-gray-500">
                Payments are handled securely by Paddle
              </p>
            </div>
          </div>
          {dashboardData?.user?.profile?.paddle_customer_id && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* ── Plan Picker Modal ── */}
      {showPlanPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanPicker(false)} />
          <div className="relative bg-white rounded-2xl border border-gray-200 max-w-lg w-full mx-4 p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowPlanPicker(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">Choose a plan</h3>
            <p className="text-sm text-gray-500 mt-1">
              {subscriptionData?.hasSubscription && subscriptionData.subscription?.status === 'active'
                ? 'Select a plan to upgrade or downgrade. Billing will be prorated automatically.'
                : 'Select a plan to continue to checkout.'}
            </p>

            {/* Period toggle */}
            <div className="flex items-center gap-1 mt-4 mb-5 text-sm">
              <button
                onClick={() => setPlanPickerPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  planPickerPeriod === 'monthly'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlanPickerPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  planPickerPeriod === 'yearly'
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Annual
              </button>
            </div>

            {/* Plans list */}
            <div className="space-y-2">
              {packages.map((pkg) => {
                const isCurrent = pkg.id === currentPkgId
                const pricing = getPricing(pkg, planPickerPeriod)

                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      if (!isCurrent) {
                        if (subscriptionData?.hasSubscription && subscriptionData.subscription?.status === 'active') {
                          handleChangePlan(pkg)
                        } else {
                          setShowPlanPicker(false)
                          router.push(`/settings/billing/checkout?package=${pkg.id}&period=${planPickerPeriod}`)
                        }
                      }
                    }}
                    disabled={isCurrent || planChangeLoading}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      isCurrent
                        ? 'border-orange-200 bg-orange-50/50 cursor-default'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{pkg.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                              <Check className="h-3 w-3" /> Current
                            </span>
                          )}
                          {pkg.is_popular && !isCurrent && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {pkg.quota_limits.max_keywords === -1 ? 'Unlimited' : pkg.quota_limits.max_keywords} keywords &middot; {pkg.quota_limits.max_domains === -1 ? 'Unlimited' : pkg.quota_limits.max_domains} domains
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="flex items-baseline gap-1 justify-end">
                          {pricing.originalPrice && pricing.originalPrice > pricing.price && (
                            <span className="text-xs line-through text-gray-300">{formatCurrency(pricing.originalPrice)}</span>
                          )}
                          <span className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(pricing.price)}</span>
                        </div>
                        <span className="text-xs text-gray-400">/{planPickerPeriod === 'yearly' ? 'year' : 'month'}</span>
                        {pricing.discount && (
                          <p className="text-[11px] text-emerald-600 mt-0.5">save {pricing.discount}%</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {packages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No plans available.</p>
            )}

            {planChangeLoading && (
              <div className="flex items-center justify-center gap-2 pt-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating your plan…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelDialog(false)} />
          <div className="relative bg-white rounded-2xl border border-gray-200 max-w-md w-full mx-4 p-6 shadow-xl">
            <button onClick={() => setShowCancelDialog(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">Cancel subscription?</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Your plan will stay active until the end of the current billing cycle. After that, you&apos;ll lose access to paid features and your tracked data.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
