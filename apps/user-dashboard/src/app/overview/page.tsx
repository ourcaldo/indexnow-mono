'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  Globe,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  useKeywords,
  useDeleteKeywords,
  type Keyword,
} from '../../lib/hooks'
import { useWorkspace } from '../../components/providers/WorkspaceProvider'
import { AddKeywordsModal } from '../../components/modals/AddKeywordsModal'

const ITEMS_PER_PAGE = 20

type SortField = 'keyword' | 'position' | 'domain' | 'country' | 'device'
type SortDirection = 'asc' | 'desc'

export default function OverviewPage() {
  const { activeDomain } = useWorkspace()

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addKeywordsOpen, setAddKeywordsOpen] = useState(false)

  const { data: keywordsData, isLoading } = useKeywords({
    domain: activeDomain || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
  })

  const deleteKeywords = useDeleteKeywords()

  const allKeywords: Keyword[] = keywordsData?.keywords ?? []
  const totalKeywordsCount = keywordsData?.total ?? 0

  // Client-side device filter (API may not support it)
  const filteredKeywords = useMemo(() => {
    if (deviceFilter === 'all') return allKeywords
    return allKeywords.filter(k => k.device_type === deviceFilter)
  }, [allKeywords, deviceFilter])

  // Client-side sort
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'keyword':
          cmp = a.keyword.localeCompare(b.keyword)
          break
        case 'position': {
          const posA = getPos(a) ?? 999
          const posB = getPos(b) ?? 999
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

  const totalPages = Math.ceil(totalKeywordsCount / ITEMS_PER_PAGE) || Math.ceil(sortedKeywords.length / ITEMS_PER_PAGE)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === sortedKeywords.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedKeywords.map(k => k.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} keyword(s)?`)) return
    deleteKeywords.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    })
  }

  // Stats from current page data
  const stats = useMemo(() => {
    const positions = sortedKeywords
      .map(k => getPos(k))
      .filter((p): p is number => p !== null && p !== undefined)

    const avgPos = positions.length > 0
      ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)
      : '—'

    return {
      total: totalKeywordsCount || sortedKeywords.length,
      top3: positions.filter(p => p <= 3).length,
      top10: positions.filter(p => p <= 10).length,
      top20: positions.filter(p => p <= 20).length,
      avgPosition: avgPos,
    }
  }, [sortedKeywords, totalKeywordsCount])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Keyword Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all your keywords across domains
          </p>
        </div>
        <button
          onClick={() => setAddKeywordsOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Keywords
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { value: stats.total, label: 'Total Keywords', color: 'text-gray-900 dark:text-gray-50', dot: 'bg-gray-400' },
          { value: stats.top3, label: 'Top 3', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
          { value: stats.top10, label: 'Top 10', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
          { value: stats.top20, label: 'Top 20', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
          { value: stats.avgPosition, label: 'Avg Position', color: 'text-gray-900 dark:text-gray-50', dot: 'bg-gray-400' },
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

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
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

          {/* Bulk delete */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteKeywords.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {sortedKeywords.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search className="h-7 w-7 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">No Keywords Found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try a different search term.' : 'Start tracking keywords to see them here.'}
            </p>
            {!searchQuery && (
              <button onClick={() => setAddKeywordsOpen(true)} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                Add keywords →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === sortedKeywords.length && sortedKeywords.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </th>
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
                  </tr>
                </thead>
                <tbody>
                  {sortedKeywords.map((kw) => {
                    const pos = getPos(kw)
                    const ranking = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
                    const checkDate = ranking?.check_date
                      ? new Date(ranking.check_date).toLocaleDateString()
                      : null

                    return (
                      <tr
                        key={kw.id}
                        className={`border-b border-gray-50 dark:border-gray-800/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${selectedIds.has(kw.id) ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(kw.id)}
                            onChange={() => toggleSelect(kw.id)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                            {kw.tags && kw.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {kw.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PositionBadge position={pos} />
                          {checkDate && <div className="text-[10px] text-gray-400 mt-0.5">{checkDate}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {kw.domain?.display_name || kw.domain?.domain_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {kw.country?.iso2_code && <Globe className="h-3 w-3 text-gray-400" />}
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
                  Page {currentPage} of {totalPages} ({totalKeywordsCount || sortedKeywords.length} total)
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

      <AddKeywordsModal open={addKeywordsOpen} onClose={() => setAddKeywordsOpen(false)} />
    </div>
  )
}

function getPos(kw: Keyword): number | null {
  const r = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
  return r?.position ?? kw.current_position ?? null
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
