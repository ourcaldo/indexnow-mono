'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Calendar,
  Globe,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  useDomains,
  useKeywords,
  useWeeklyTrends,
  type Keyword,
  type WeeklyTrend,
} from '../../lib/hooks'

const ITEMS_PER_PAGE = 25

type SortField = 'keyword' | 'position' | 'date' | 'domain'
type SortDirection = 'asc' | 'desc'

interface HistoryRow {
  id: string
  keyword: string
  domain: string
  domainId: string | undefined
  country: string
  device: string
  position: number | null
  previousPosition: number | null
  change: number | null
  checkDate: string
  checkDateRaw: string
}

export default function RankHistoryPage() {
  const { data: domains } = useDomains()
  const { data: trends, isLoading: trendsLoading } = useWeeklyTrends()
  const { data: keywordsData, isLoading: kwLoading } = useKeywords({ limit: 100 })

  const [selectedDomainId, setSelectedDomainId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const isLoading = trendsLoading || kwLoading

  const allKeywords: Keyword[] = keywordsData?.keywords ?? []

  // Build history rows from keywords' recent_ranking + weekly trends
  const historyRows = useMemo(() => {
    const rows: HistoryRow[] = []

    const keywords = selectedDomainId
      ? allKeywords.filter(k => k.domain?.id === selectedDomainId)
      : allKeywords

    for (const kw of keywords) {
      const rankings = Array.isArray(kw.recent_ranking) ? kw.recent_ranking : kw.recent_ranking ? [kw.recent_ranking] : []
      if (rankings.length > 0) {
        for (let i = 0; i < rankings.length; i++) {
          const ranking = rankings[i]
          const prevRanking = rankings[i + 1]
          const change = ranking.position !== null && prevRanking?.position !== null && ranking.position !== undefined && prevRanking?.position !== undefined
            ? prevRanking.position - ranking.position
            : null
          rows.push({
            id: `${kw.id}-${ranking.check_date}`,
            keyword: kw.keyword,
            domain: kw.domain?.display_name || kw.domain?.domain_name || '—',
            domainId: kw.domain?.id,
            country: kw.country?.name || kw.country?.iso2_code || '—',
            device: kw.device_type || 'desktop',
            position: ranking.position,
            previousPosition: prevRanking?.position ?? null,
            change,
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
          previousPosition: null,
          change: null,
          checkDate: '—',
          checkDateRaw: '',
        })
      }
    }

    // Also include weekly trends that might have data not in keywords list
    if (trends) {
      for (const t of trends) {
        if (!rows.find(r => r.keyword === t.keyword && r.domain === t.domain)) {
          rows.push({
            id: `trend-${t.id}`,
            keyword: t.keyword,
            domain: t.domain,
            domainId: undefined,
            country: '—',
            device: 'desktop',
            position: t.current_position,
            previousPosition: t.previous_position,
            change: t.change,
            checkDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            checkDateRaw: new Date().toISOString(),
          })
        }
      }
    }

    return rows
  }, [allKeywords, selectedDomainId, trends])

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
    const uniqueKeywords = new Set(historyRows.map(r => r.keyword)).size
    const improved = historyRows.filter(r => r.change !== null && r.change > 0).length
    const declined = historyRows.filter(r => r.change !== null && r.change < 0).length

    return {
      totalChecks: historyRows.length,
      uniqueKeywords,
      improved,
      declined,
    }
  }, [historyRows])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
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
          { value: stats.totalChecks, label: 'Total Checks', color: 'text-gray-900 dark:text-gray-50', dot: 'bg-gray-400' },
          { value: stats.uniqueKeywords, label: 'Keywords', color: 'text-gray-900 dark:text-gray-50', dot: 'bg-blue-500' },
          { value: stats.improved, label: 'Improved', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
          { value: stats.declined, label: 'Declined', color: 'text-red-500 dark:text-red-400', dot: 'bg-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
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
            value={selectedDomainId}
            onChange={(e) => { setSelectedDomainId(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Domains</option>
            {(domains ?? []).map(d => (
              <option key={d.id} value={d.id}>{d.display_name || d.domain_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Calendar className="h-7 w-7 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
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
                      Change
                    </th>
                    <th
                      className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('domain')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Domain <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
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
                        Check Date <ArrowUpDown className="h-3 w-3" />
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
                        <ChangeBadge change={row.change} />
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

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
  if (change === 0) return <span className="text-xs text-gray-400">0</span>
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="w-3 h-3" /> +{change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
      <TrendingDown className="w-3 h-3" /> {change}
    </span>
  )
}
