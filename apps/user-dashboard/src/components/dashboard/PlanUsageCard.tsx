'use client'

import { Package, Zap, ArrowRight } from 'lucide-react'

interface PlanInfo {
  name: string
  slug: string
  keywordsLimit: number
  keywordsUsed: number
  dailyChecksLimit: number
  dailyChecksUsed: number
  isTrial: boolean
  expiresAt: string | null
}

export function PlanUsageCard({ plan }: { plan: PlanInfo | null }) {
  if (!plan) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Current Plan</h3>
        </div>
        <div className="p-5 text-center">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 inline-block mb-3">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No Active Plan</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Subscribe to start tracking keywords
          </p>
          <a
            href="/settings/plans-billing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View Plans <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    )
  }

  const keywordPct = plan.keywordsLimit > 0 ? Math.round((plan.keywordsUsed / plan.keywordsLimit) * 100) : 0
  const dailyPct = plan.dailyChecksLimit > 0 ? Math.round((plan.dailyChecksUsed / plan.dailyChecksLimit) * 100) : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Current Plan</h3>
        <a
          href="/settings/plans-billing"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Manage
        </a>
      </div>
      <div className="p-5 space-y-4">
        {/* Plan name */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
            {plan.isTrial && (
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-600 dark:text-amber-400">Trial</span>
            )}
          </div>
        </div>

        {/* Keywords usage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Keywords</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {plan.keywordsUsed} / {plan.keywordsLimit}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                keywordPct > 90 ? 'bg-red-500' : keywordPct > 70 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(keywordPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily checks usage */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Daily Checks</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {plan.dailyChecksUsed} / {plan.dailyChecksLimit}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dailyPct > 90 ? 'bg-red-500' : dailyPct > 70 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(dailyPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Expiry */}
        {plan.expiresAt && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Renews {new Date(plan.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )
}
