'use client'

import { useState, useMemo } from 'react'
import { useDomain } from '@indexnow/ui/contexts'
import { useDashboardData } from '@indexnow/ui/hooks'
import {
  Search,
  ArrowUpDown,
  Globe,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
} from 'lucide-react'
import type { DashboardRecentKeyword } from '@indexnow/shared'

const ITEMS_PER_PAGE = 20

type SortField = 'keyword' | 'position' | 'domain' | 'country' | 'device'
type SortDirection = 'asc' | 'desc'

export default function OverviewPage() {
  const {
    domains,
    selectedDomainId,
    setSelectedDomainId,
  } = useDomain()

  const { data: dashboardData, isLoading } = useDashboardData()

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')

  const allKeywords: DashboardRecentKeyword[] = dashboardData?.rankTracking?.recentKeywords ?? []

  // Filter keywords by selected domain
  const domainKeywords = useMemo(() => {
    if (!selectedDomainId) return allKeywords
    return allKeywords.filter(k => k.domain?.id === selectedDomainId)
  }, [allKeywords, selectedDomainId])

  // Apply search, device filter
  const filteredKeywords = useMemo(() => {
    let result = domainKeywords

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(k =>
        k.keyword.toLowerCase().includes(q) ||
        k.domain?.domain_name?.toLowerCase().includes(q) ||
        k.country?.name?.toLowerCase().includes(q)
      )
    }

    if (deviceFilter !== 'all') {
      result = result.filter(k => k.device_type === deviceFilter)
    }

    return result
  }, [domainKeywords, searchQuery, deviceFilter])

  // Sort
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'keyword':
          cmp = a.keyword.localeCompare(b.keyword)
          break
        case 'position': {
          const posA = a.recent_ranking?.[0]?.position ?? 999
          const posB = b.recent_ranking?.[0]?.position ?? 999
          cmp = posA - posB
          break
        }
        case 'domain':
          cmp = (a.domain?.domain_name ?? '').localeCompare(b.domain?.domain_name ?? '')
          break
        case 'country':
          cmp = (a.country?.name ?? '').localeCompare(b.country?.name ?? '')
          break
        case 'device':
          cmp = (a.device_type ?? '').localeCompare(b.device_type ?? '')
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredKeywords, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedKeywords.length / ITEMS_PER_PAGE)
  const paginatedKeywords = sortedKeywords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Stats
  const stats = useMemo(() => {
    const positions = domainKeywords
      .map(k => k.recent_ranking?.[0]?.position)
      .filter((p): p is number => p !== null && p !== undefined)

    const avgPos = positions.length > 0
      ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)
      : '—'

    return {
      total: domainKeywords.length,
      top3: positions.filter(p => p <= 3).length,
      top10: positions.filter(p => p <= 10).length,
      top20: positions.filter(p => p <= 20).length,
      avgPosition: avgPos,
    }
  }, [domainKeywords])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/60 rounded mb-2" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
          Keyword Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track and manage all your keywords across domains
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { value: stats.total, label: 'Total Keywords', icon: <Search className="w-4 h-4" />, color: 'text-gray-900 dark:text-gray-50' },
          { value: stats.top3, label: 'Top 3', icon: <Target className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
          { value: stats.top10, label: 'Top 10', icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
          { value: stats.top20, label: 'Top 20', icon: <BarChart3 className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
          { value: stats.avgPosition, label: 'Avg Position', icon: <Globe className="w-4 h-4" />, color: 'text-gray-900 dark:text-gray-50' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search keywords, domains..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Domain Filter */}
          <select
            value={selectedDomainId || ''}
            onChange={(e) => { setSelectedDomainId(e.target.value || ''); setCurrentPage(1) }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Domains</option>
            {domains.map(d => {
              const dr = d as unknown as Record<string, unknown>
              return (
                <option key={d.id} value={d.id}>
                  {(dr.display_name as string) || (dr.domain_name as string) || d.name || d.domain}
                </option>
              )
            })}
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => { setDeviceFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredKeywords.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">No Keywords Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try a different search term.' : 'Start tracking keywords to see them here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    {([
                      { field: 'keyword' as SortField, label: 'Keyword', align: 'left' },
                      { field: 'position' as SortField, label: 'Position', align: 'center' },
                      { field: 'domain' as SortField, label: 'Domain', align: 'center' },
                      { field: 'country' as SortField, label: 'Country', align: 'center' },
                      { field: 'device' as SortField, label: 'Device', align: 'center' },
                    ]).map(col => (
                      <th
                        key={col.field}
                        className={`px-4 py-3 text-${col.align} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors`}
                        onClick={() => handleSort(col.field)}
                      >
                        <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                          {col.label}
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Check
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKeywords.map((kw) => {
                    const pos = kw.recent_ranking?.[0]?.position ?? null
                    const checkDate = kw.recent_ranking?.[0]?.check_date
                      ? new Date(kw.recent_ranking[0].check_date).toLocaleDateString()
                      : '—'

                    return (
                      <tr
                        key={kw.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PositionBadge position={pos} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {kw.domain?.display_name || kw.domain?.domain_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {kw.country?.iso2_code && (
                              <Globe className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {kw.country?.name || kw.country?.iso2_code || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                            {kw.device_type === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                            <span className="text-sm capitalize">{kw.device_type || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-400 dark:text-gray-500">{checkDate}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedKeywords.length)} of {sortedKeywords.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PositionBadge({ position }: { position: number | null }) {
  if (!position) return <span className="text-sm text-gray-400">—</span>
  const cls =
    position <= 3
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : position <= 10
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        : position <= 20
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 text-xs font-bold rounded-full ${cls}`}>
      {position}
    </span>
  )
}
