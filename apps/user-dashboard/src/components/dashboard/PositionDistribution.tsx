'use client'

import { BarChart3 } from 'lucide-react'

interface PositionDistributionProps {
  keywords: Array<{
    current_position?: number | null
    recent_ranking?: { position?: number | null } | null
  }>
}

interface PositionBucket {
  label: string
  range: string
  count: number
  color: string
  bgColor: string
}

export function PositionDistribution({ keywords }: PositionDistributionProps) {
  const buckets = computeBuckets(keywords)
  const total = keywords.length
  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Position Distribution</h3>
      </div>
      <div className="p-5">
        {total === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No keyword data yet
          </p>
        ) : (
          <div className="space-y-3">
            {buckets.map((bucket) => {
              const pct = total > 0 ? Math.round((bucket.count / total) * 100) : 0
              const barWidth = maxCount > 0 ? Math.max((bucket.count / maxCount) * 100, 2) : 0
              return (
                <div key={bucket.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${bucket.color}`}>{bucket.label}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{bucket.range}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{bucket.count}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bucket.bgColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function computeBuckets(
  keywords: Array<{
    current_position?: number | null
    recent_ranking?: { position?: number | null } | null
  }>
): PositionBucket[] {
  const counts = { top3: 0, top10: 0, top20: 0, top50: 0, beyond: 0 }

  for (const kw of keywords) {
    const pos = kw.current_position ?? kw.recent_ranking?.position ?? null
    if (pos === null || pos === 0) continue
    if (pos <= 3) counts.top3++
    else if (pos <= 10) counts.top10++
    else if (pos <= 20) counts.top20++
    else if (pos <= 50) counts.top50++
    else counts.beyond++
  }

  return [
    { label: 'Top 3', range: '#1–3', count: counts.top3, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500' },
    { label: 'Top 10', range: '#4–10', count: counts.top10, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500' },
    { label: 'Top 20', range: '#11–20', count: counts.top20, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500' },
    { label: 'Top 50', range: '#21–50', count: counts.top50, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500' },
    { label: '50+', range: '#51+', count: counts.beyond, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-400' },
  ]
}
