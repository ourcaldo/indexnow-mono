'use client'

import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  change?: number | null
  changeLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeLabel = 'vs last week',
  variant = 'default',
}: StatCardProps) {
  const iconColorMap = {
    default: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    success: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{value}</p>
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-1.5 text-xs">
              {change > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +{change}%
                </span>
              ) : change < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400 font-medium">
                  <TrendingDown className="w-3 h-3" />
                  {change}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-gray-400 font-medium">
                  <Minus className="w-3 h-3" />
                  0%
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColorMap[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
