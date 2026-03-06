'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Bell, Plus, Globe } from 'lucide-react'
import { useAuth } from '@indexnow/auth'
import { useDomains } from '../../lib/hooks'
import { AddDomainModal } from '../modals/AddDomainModal'
import { AddKeywordsModal } from '../modals/AddKeywordsModal'

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: domains } = useDomains()
  const [addDomainOpen, setAddDomainOpen] = useState(false)
  const [addKeywordsOpen, setAddKeywordsOpen] = useState(false)

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname?.startsWith('/overview')) return 'Keyword Overview'
    if (pathname?.startsWith('/rank-history')) return 'Rank History'
    if (pathname?.startsWith('/settings/profile')) return 'Profile'
    if (pathname?.startsWith('/settings')) return 'Settings'
    return 'Dashboard'
  }

  const getPageDescription = () => {
    if (pathname === '/') {
      const count = domains?.length ?? 0
      return count > 0 ? `${count} domain${count !== 1 ? 's' : ''} tracked` : 'Welcome back'
    }
    if (pathname?.startsWith('/overview')) return 'Track and manage your keywords'
    if (pathname?.startsWith('/rank-history')) return 'Analyze ranking trends over time'
    if (pathname?.startsWith('/settings')) return 'Manage your account preferences'
    return ''
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <>
      <header className="h-[60px] bg-white border-b border-gray-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0">
        {/* Left: menu toggle + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] text-gray-400 truncate hidden sm:block">
              {getPageDescription()}
            </p>
          </div>
        </div>

        {/* Right: action buttons + notifications + avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Add Domain */}
          <button
            onClick={() => setAddDomainOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Add Domain
          </button>

          {/* Add Keywords */}
          <button
            onClick={() => setAddKeywordsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Keywords
          </button>

          {/* Mobile: single + button */}
          <button
            onClick={() => setAddKeywordsOpen(true)}
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-[18px] h-[18px]" />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-0.5" />

          {/* Avatar */}
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {initials}
          </button>
        </div>
      </header>

      <AddDomainModal open={addDomainOpen} onClose={() => setAddDomainOpen(false)} />
      <AddKeywordsModal open={addKeywordsOpen} onClose={() => setAddKeywordsOpen(false)} />
    </>
  )
}
