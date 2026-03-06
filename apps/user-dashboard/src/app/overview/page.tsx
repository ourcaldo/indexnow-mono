'use client'

import { useState, useMemo } from 'react'
import {
  ExternalLink,
  ArrowUpDown,
  Globe,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import {
  useKeywords,
  useDeleteKeywords,
  type Keyword,
} from '../../lib/hooks'
import { useWorkspace } from '../../components/providers/WorkspaceProvider'
import { fmtDate, fmtDevice, fmtCountry } from '../../lib/utils'

const ITEMS_PER_PAGE = 20

type SortField = 'keyword' | 'position' | 'country' | 'device'
type SortDirection = 'asc' | 'desc'

export default function OverviewPage() {
  const { activeDomain } = useWorkspace()

  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: keywordsData, isLoading } = useKeywords({
    domain: activeDomain || undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  })

  const deleteKeywords = useDeleteKeywords()

  const allKeywords: Keyword[] = keywordsData?.keywords ?? []
  const totalKeywordsCount = keywordsData?.total ?? 0

  // Unique countries derived from loaded keywords for the country filter
  const uniqueCountries = useMemo(() => {
    const seen = new Set<string>()
    const list: { iso2_code: string; name: string }[] = []
    for (const k of allKeywords) {
      const code = k.country?.iso2_code ?? ''
      if (code && !seen.has(code)) {
        seen.add(code)
        list.push({ iso2_code: code, name: k.country?.name || code.toUpperCase() })
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [allKeywords])

  // Client-side device + country filter
  const filteredKeywords = useMemo(() => {
    let kws = allKeywords
    if (deviceFilter !== 'all') kws = kws.filter(k => k.device_type === deviceFilter)
    if (countryFilter !== 'all') kws = kws.filter(k => (k.country?.iso2_code ?? '') === countryFilter)
    return kws
  }, [allKeywords, deviceFilter, countryFilter])

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
      : 'â€”'

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
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-7 w-10 bg-gray-200 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded mb-2" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Keyword Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage all your keywords across domains
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <select
            value={deviceFilter}
            onChange={(e) => { setDeviceFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-700"
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <select
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-700"
          >
            <option value="all">All Countries</option>
            {uniqueCountries.map(c => (
              <option key={c.iso2_code} value={c.iso2_code}>{c.name}</option>
            ))}
          </select>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteKeywords.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { value: stats.total, label: 'Total Keywords', color: 'text-gray-900', dot: 'bg-gray-400' },
          { value: stats.top3, label: 'Top 3', color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { value: stats.top10, label: 'Top 10', color: 'text-blue-600', dot: 'bg-blue-500' },
          { value: stats.top20, label: 'Top 20', color: 'text-amber-600', dot: 'bg-amber-500' },
          { value: stats.avgPosition, label: 'Avg Position', color: 'text-gray-900', dot: 'bg-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>



      {/* Keywords Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sortedKeywords.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Globe className="h-7 w-7 text-gray-300 mx-auto mb-3" />
            <h3 className="mb-1 text-sm font-semibold text-gray-900">No Keywords Found</h3>
            <p className="text-xs text-gray-500">Start tracking keywords to see them here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === sortedKeywords.length && sortedKeywords.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-3 w-8 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    {([
                      { field: 'keyword' as SortField, label: 'Keyword', align: 'left' },
                      { field: 'position' as SortField, label: 'Position', align: 'center' },
                      { field: 'keyword' as SortField, label: 'URL', align: 'center', noSort: true },
                      { field: 'country' as SortField, label: 'Country', align: 'center' },
                      { field: 'device' as SortField, label: 'Device', align: 'center' },
                      { field: 'keyword' as SortField, label: 'Last Checked', align: 'center', noSort: true },
                    ] as Array<{ field: SortField; label: string; align: string; noSort?: boolean }>).map(col => (
                      <th
                        key={col.label}
                        className={`px-4 py-3 text-${col.align} text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${col.noSort ? '' : 'cursor-pointer hover:text-gray-900'} transition-colors`}
                        onClick={() => !col.noSort && handleSort(col.field)}
                      >
                        <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                          {col.label}
                          {!col.noSort && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedKeywords.map((kw, idx) => {
                    const pos = getPos(kw)
                    const ranking = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
                    const checkDate = ranking?.check_date
                      ? fmtDate(ranking.check_date)
                      : null

                    return (
                      <tr
                        key={kw.id}
                        className={`border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors ${selectedIds.has(kw.id) ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(kw.id)}
                            onChange={() => toggleSelect(kw.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-gray-400 tabular-nums w-8">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{kw.keyword}</span>
                            {kw.tags && kw.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {kw.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PositionBadge position={pos} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ranking?.url ? (
                            <div className="inline-flex items-center gap-1 max-w-[160px]">
                              <span className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap block max-w-[130px]" title={ranking.url}>
                                {ranking.url.replace(/^https?:\/\/(www\.)?/, '')}
                              </span>
                              <a href={ranking.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors" title="Open in new tab">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">â€”</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{fmtCountry(kw.country)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-500">
                            {kw.device_type === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                            <span className="text-xs">{fmtDevice(kw.device_type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-400">{checkDate || 'â€”'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages} ({totalKeywordsCount || sortedKeywords.length} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

function getPos(kw: Keyword): number | null {
  const r = Array.isArray(kw.recent_ranking) ? kw.recent_ranking[0] : kw.recent_ranking
  return r?.position ?? kw.current_position ?? null
}

function PositionBadge({ position }: { position: number | null }) {
  if (!position) return <span className="text-gray-300 text-sm">â€”</span>
  const cls =
    position <= 3 ? 'text-emerald-600 font-bold'
      : position <= 10 ? 'text-blue-600 font-semibold'
        : position <= 20 ? 'text-amber-600 font-medium'
          : 'text-gray-500'
  return <span className={`text-sm tabular-nums ${cls}`}>{position}</span>
}
