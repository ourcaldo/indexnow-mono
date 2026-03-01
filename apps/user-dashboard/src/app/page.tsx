'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  TrendingUp,
  Globe,
  BarChart3,
  ArrowRight,
  Target,
  Calendar,
  RefreshCw,
  Monitor,
  Smartphone,
  Crown,
  Plus,
} from 'lucide-react'
import { useAuth } from '@indexnow/auth'
import {
  useDomains,
  useProfile,
  useKeywordUsage,
  useDashboardAggregate,
  useCheckRank,
  type Keyword,
} from '../lib/hooks'
import { useWorkspace } from '../components/providers/WorkspaceProvider'
import { AddDomainModal } from '../components/modals/AddDomainModal'
import { AddKeywordsModal } from '../components/modals/AddKeywordsModal'

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeDomain } = useWorkspace()
  const { data: domains, isLoading: domainsLoading } = useDomains()
  const { data: profile } = useProfile()
  const { data: keywordUsage } = useKeywordUsage()
  const { data: dashboardData, isLoading: dashLoading, error: dashError } = useDashboardAggregate(activeDomain)
  const checkRank = useCheckRank()

  const [addDomainOpen, setAddDomainOpen] = useState(false)
  const [addKeywordsOpen, setAddKeywordsOpen] = useState(false)

  const isLoading = domainsLoading || dashLoading

  // Get keywords from dashboard aggregate
  const allKeywords: Keyword[] = useMemo(() => {
    return dashboardData?.rankTracking?.recentKeywords ?? []
  }, [dashboardData])

  // Use all keywords (domain filtering handled server-side via activeDomain)
  const keywords = allKeywords

  // Compute stats
  const stats = useMemo(() => {
    const positions = keywords
      .map(kw => {
        const r = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
        return r?.position ?? kw.current_position
      })
      .filter((p): p is number => p !== null && p !== undefined && p > 0)

    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null

    return {
      totalKeywords: keywords.length,
      avgPosition,
      top3: positions.filter(p => p <= 3).length,
      top10: positions.filter(p => p <= 10).length,
      top20: positions.filter(p => p <= 20).length,
      top50: positions.filter(p => p <= 50).length,
      noRank: keywords.length - positions.length,
    }
  }, [keywords])

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()
  const displayName = user?.name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there'

  // Plan info
  const planName = profile?.package?.name || 'Free'
  const kwLimit = profile?.package?.quota_limits?.keywords_limit ?? 0
  const kwUsed = keywordUsage?.used ?? profile?.keywords_used ?? 0

  const getPosition = (kw: Keyword): number | null => {
    const r = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
    return r?.position ?? kw.current_position ?? null
  }

  // Loading
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Error
  if (dashError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl text-red-500">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Something went wrong</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{dashError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No active subscription
  const hasSubscription = profile?.subscription_status === 'active' || profile?.package?.id
  if (!hasSubscription) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{greeting}, {displayName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get started by choosing a plan to unlock keyword tracking</p>
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <Crown className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unlock Rank Tracking</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Subscribe to a plan to start tracking your keyword rankings and SEO performance.
          </p>
          <button
            onClick={() => router.push('/settings?tab=plans-billing')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            View Plans <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // No domains
  if (domains && domains.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{greeting}, {displayName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your first domain to start tracking rankings</p>
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <Globe className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add Your First Domain</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Start monitoring your search engine rankings by adding a domain.
          </p>
          <button
            onClick={() => setAddDomainOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Domain
          </button>
        </div>
        <AddDomainModal open={addDomainOpen} onClose={() => setAddDomainOpen(false)} />
      </div>
    )
  }

  // === MAIN DASHBOARD ===
  return (
    <div className="space-y-6">
      {/* Greeting + domain filter + add buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{greeting}, {displayName}</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Keywords" value={stats.totalKeywords} icon={<Search className="w-4 h-4" />} iconColor="text-blue-600 dark:text-blue-400" />
        <MetricCard label="Avg. Position" value={stats.avgPosition !== null ? stats.avgPosition.toFixed(1) : '—'} icon={<Target className="w-4 h-4" />} iconColor="text-emerald-600 dark:text-emerald-400" />
        <MetricCard label="Top 10" value={stats.top10} icon={<TrendingUp className="w-4 h-4" />} iconColor="text-amber-600 dark:text-amber-400" subtitle={stats.top3 > 0 ? `${stats.top3} in top 3` : undefined} />
        <MetricCard label="Tracked Domains" value={domains?.length ?? 0} icon={<Globe className="w-4 h-4" />} iconColor="text-violet-600 dark:text-violet-400" />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keywords table — 2/3 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Keywords</h3>
              <button onClick={() => router.push('/overview')} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                View all →
              </button>
            </div>
            {keywords.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No keywords tracked yet</p>
                <button onClick={() => setAddKeywordsOpen(true)} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                  Add keywords →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-white/[0.02]">
                      <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Keyword</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3">Position</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden sm:table-cell">Device</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Domain</th>
                      <th className="text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden lg:table-cell">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.slice(0, 10).map((kw) => {
                      const pos = getPosition(kw)
                      return (
                        <tr key={kw.id} className="border-t border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                            {kw.country?.iso2_code && (
                              <span className="ml-2 text-[10px] text-gray-400 uppercase">{kw.country.iso2_code}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <PositionBadge position={pos} />
                          </td>
                          <td className="px-3 py-3 text-center hidden sm:table-cell">
                            {kw.device_type === 'mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block max-w-[140px]">
                              {kw.domain?.display_name || kw.domain?.domain_name || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell">
                            <button
                              onClick={() => checkRank.mutate(kw.id)}
                              disabled={checkRank.isPending}
                              title="Check rank now"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${checkRank.isPending ? 'animate-spin' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Plan usage */}
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Plan Usage</h3>
              <a href="/settings?tab=plans-billing" className="text-xs font-medium text-blue-600 dark:text-blue-400">Manage</a>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{planName}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Keywords</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {kwUsed} / {kwLimit || '∞'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${kwLimit > 0 ? Math.min((kwUsed / kwLimit) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Position distribution */}
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Position Distribution</h3>
            {stats.totalKeywords === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                <DistRow label="Top 3" count={stats.top3} total={stats.totalKeywords} color="bg-emerald-500" />
                <DistRow label="4 - 10" count={stats.top10 - stats.top3} total={stats.totalKeywords} color="bg-blue-500" />
                <DistRow label="11 - 20" count={stats.top20 - stats.top10} total={stats.totalKeywords} color="bg-amber-500" />
                <DistRow label="21 - 50" count={stats.top50 - stats.top20} total={stats.totalKeywords} color="bg-orange-400" />
                <DistRow label="50+" count={stats.totalKeywords - stats.top50} total={stats.totalKeywords} color="bg-gray-400" />
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <QuickActionBtn label="Add Keywords" icon={<Plus className="w-4 h-4" />} onClick={() => setAddKeywordsOpen(true)} />
              <QuickActionBtn label="Keyword Overview" icon={<Search className="w-4 h-4" />} onClick={() => router.push('/overview')} />
              <QuickActionBtn label="Rank History" icon={<BarChart3 className="w-4 h-4" />} onClick={() => router.push('/rank-history')} />
              <QuickActionBtn label="Plans & Billing" icon={<Crown className="w-4 h-4" />} onClick={() => router.push('/settings?tab=plans-billing')} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDomainModal open={addDomainOpen} onClose={() => setAddDomainOpen(false)} />
      <AddKeywordsModal open={addKeywordsOpen} onClose={() => setAddKeywordsOpen(false)} />
    </div>
  )
}

// === Sub-components ===

function QuickActionBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  )
}

function MetricCard({ label, value, icon, iconColor, subtitle }: {
  label: string; value: string | number; icon: React.ReactNode; iconColor: string; subtitle?: string
}) {
  return (
    <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <span className={iconColor}>{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function PositionBadge({ position }: { position: number | null }) {
  if (!position) return <span className="text-gray-400 text-sm">—</span>
  const cls =
    position <= 3 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : position <= 10 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        : position <= 20 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 text-xs font-bold rounded-md ${cls}`}>
      {position}
    </span>
  )
}

function DistRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-gray-900 dark:text-white">{count} <span className="font-normal text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/60 rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="h-3 w-3 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800/60 rounded" />
              <div className="h-5 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-40" />
          <div className="bg-white dark:bg-[#141520] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-48" />
        </div>
      </div>
    </div>
  )
}
