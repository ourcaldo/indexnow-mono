'use client'

import { useRouter } from 'next/navigation'
import {
  Search,
  TrendingUp,
  History,
  CreditCard,
  Plus,
  ArrowRight,
} from 'lucide-react'

interface QuickAction {
  label: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}

export function QuickActionsGrid() {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: 'Add Keywords',
      description: 'Track new keywords',
      icon: <Plus className="w-5 h-5" />,
      href: '/indexnow/overview',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      label: 'Keyword Overview',
      description: 'View all tracked keywords',
      icon: <Search className="w-5 h-5" />,
      href: '/indexnow/overview',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    },
    {
      label: 'Rank History',
      description: 'Position change history',
      icon: <History className="w-5 h-5" />,
      href: '/indexnow/rank-history',
      color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    },
    {
      label: 'Manage Billing',
      description: 'Plans & subscriptions',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/settings/plans-billing',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Quick Actions</h3>
      </div>
      <div className="p-4 space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-left"
          >
            <div className={`p-2 rounded-lg ${action.color} flex-shrink-0`}>
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
