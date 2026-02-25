'use client'

import { Calendar } from 'lucide-react'

interface WelcomeHeaderProps {
  userName: string | null
  domainCount: number
  keywordCount: number
  avgPosition: number | null
}

export function WelcomeHeader({ userName, domainCount, keywordCount, avgPosition }: WelcomeHeaderProps) {
  const greeting = getGreeting()
  const displayName = userName || 'there'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            {greeting}, {displayName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <SummaryChip label="Domains" value={domainCount} />
          <SummaryChip label="Keywords" value={keywordCount} />
          {avgPosition !== null && (
            <SummaryChip label="Avg Position" value={avgPosition.toFixed(1)} />
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
