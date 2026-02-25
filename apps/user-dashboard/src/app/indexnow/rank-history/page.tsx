'use client'

import { useState, useMemo } from 'react'
import { useDomain } from '@indexnow/ui/contexts'
import { useDashboardData } from '@indexnow/ui/hooks'
import {
  Search,
  Calendar,
  Globe,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Clock,
  BarChart3,
  Hash,
} from 'lucide-react'
import type { DashboardRecentKeyword } from '@indexnow/shared'

const ITEMS_PER_PAGE = 25

type SortField = 'keyword' | 'position' | 'date' | 'domain'
type SortDirection = 'asc' | 'desc'

export default function RankHistoryPage() {
  const {
    domains,
    selectedDomainId,
    setSelectedDomainId,
  } = useDomain()

  const { data: dashboardData, isLoading } = useDashboardData()

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const allKeywords: DashboardRecentKeyword[] = dashboardData?.rankTracking?.recentKeywords ?? []

  // Build history rows from recent keywords
  const historyRows = useMemo(() => {
    const rows: Array<{
      id: string
      keyword: string
      domain: string
      domainId: string | undefined
      country: string
      device: string
      position: number | null
      checkDate: string
      checkDateRaw: string
    }> = []

    const keywords = selectedDomainId
      ? allKeywords.filter(k => k.domain?.id === selectedDomainId)
      : allKeywords

    for (const kw of keywords) {
      if (kw.recent_ranking && kw.recent_ranking.length > 0) {
        for (const ranking of kw.recent_ranking) {
          rows.push({
            id: `${kw.id}-${ranking.check_date}`,
            keyword: kw.keyword,
            domain: kw.domain?.display_name || kw.domain?.domain_name || '—',
            domainId: kw.domain?.id,
            country: kw.country?.name || kw.country?.iso2_code || '—',
            device: kw.device_type || 'desktop',
            position: ranking.position,
            checkDate: ranking.check_date
              ? new Date(ranking.check_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—',
            checkDateRaw: ranking.check_date || '',
          })
        }
      } else {
        rows.push({
          id: kw.id,
          keyword: kw.keyword,
          domain: kw.domain?.display_name || kw.domain?.domain_name || '—',
          domainId: kw.domain?.id,
          country: kw.country?.name || kw.country?.iso2_code || '—',
          device: kw.device_type || 'desktop',
          position: null,
          checkDate: '—',
          checkDateRaw: '',
        })
      }
    }

    return rows
  }, [allKeywords, selectedDomainId])

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery) return historyRows
    const q = searchQuery.toLowerCase()
    return historyRows.filter(r =>
      r.keyword.toLowerCase().includes(q) ||
      r.domain.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q)
    )
  }, [historyRows, searchQuery])

  // Sort
  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'keyword':
          cmp = a.keyword.localeCompare(b.keyword)
          break
        case 'position': {
          const posA = a.position ?? 999
          const posB = b.position ?? 999
          cmp = posA - posB
          break
        }
        case 'date':
          cmp = a.checkDateRaw.localeCompare(b.checkDateRaw)
          break
        case 'domain':
          cmp = a.domain.localeCompare(b.domain)
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredRows, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / ITEMS_PER_PAGE)
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'date' ? 'desc' : 'asc')
    }
    setCurrentPage(1)
  }

  // Stats
  const stats = useMemo(() => {
    const checksWithPosition = historyRows.filter(r => r.position !== null)
    const uniqueKeywords = new Set(historyRows.map(r => r.keyword)).size
    const latestCheck = historyRows
      .filter(r => r.checkDateRaw)
      .sort((a, b) => b.checkDateRaw.localeCompare(a.checkDateRaw))[0]?.checkDate || '—'

    return {
      totalChecks: historyRows.length,
      uniqueKeywords,
      latestCheck,
      rankedChecks: checksWithPosition.length,
    }
  }, [historyRows])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          {Array.from({ length: 10 }).map((_, i) => (
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
          Rank History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View ranking check history across all your tracked keywords
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { value: stats.totalChecks, label: 'Total Checks', icon: <BarChart3 className="w-4 h-4" /> },
          { value: stats.uniqueKeywords, label: 'Keywords Tracked', icon: <Hash className="w-4 h-4" /> },
          { value: stats.rankedChecks, label: 'Ranked Results', icon: <Globe className="w-4 h-4" /> },
          { value: stats.latestCheck, label: 'Latest Check', icon: <Clock className="w-4 h-4" /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">No Rank History</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try a different search term.' : 'Ranking data will appear here after your first keyword check.'}
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
                      Country
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Device
                    </th>
                    <th
                      className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Check Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PositionBadge position={row.position} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{row.domain}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{row.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                          {row.device === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                          <span className="text-sm capitalize">{row.device}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{row.checkDate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedRows.length)} of {sortedRows.length}
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
