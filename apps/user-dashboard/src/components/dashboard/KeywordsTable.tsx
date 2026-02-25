'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus, ExternalLink, MoreHorizontal } from 'lucide-react'
import type { KeywordData } from './types'

interface KeywordsTableProps {
  keywords: KeywordData[]
  title?: string
  maxRows?: number
  showViewAll?: boolean
}

function PositionBadge({ position }: { position: number | null }) {
  if (position === null || position === 0) {
    return <span className="text-gray-400 text-sm">—</span>
  }
  const color =
    position <= 3
      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
      : position <= 10
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
        : position <= 20
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 text-xs font-semibold rounded-md ${color}`}>
      {position}
    </span>
  )
}

function ChangeIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null || previous === 0) {
    return <span className="text-gray-300">—</span>
  }
  const diff = previous - current // positive = improved (position number went down)
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
        <Minus className="w-3 h-3" /> 0
      </span>
    )
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
        <TrendingUp className="w-3 h-3" /> +{diff}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
      <TrendingDown className="w-3 h-3" /> {diff}
    </span>
  )
}

export function KeywordsTable({ keywords, title = 'Top Keywords', maxRows = 8, showViewAll = true }: KeywordsTableProps) {
  const router = useRouter()
  const display = keywords.slice(0, maxRows)

  if (keywords.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No keywords tracked yet</p>
          <button
            onClick={() => router.push('/indexnow/overview')}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Add your first keyword →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        {showViewAll && (
          <button
            onClick={() => router.push('/indexnow/overview')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            See All <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Keyword</th>
              <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3">Position</th>
              <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden sm:table-cell">Change</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Domain</th>
              <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden lg:table-cell">Device</th>
              <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-3 hidden lg:table-cell">Country</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {display.map((kw) => (
              <tr key={kw.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <PositionBadge position={kw.current_position} />
                </td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  <ChangeIndicator current={kw.current_position} previous={kw.position_1d} />
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] block">
                    {kw.domain?.display_name || kw.domain?.domain_name || '—'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center hidden lg:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{kw.device_type || '—'}</span>
                </td>
                <td className="px-3 py-3 text-center hidden lg:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{kw.country?.iso2_code || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
