'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  LayoutDashboard,
  Search,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react'
import { authService } from '@indexnow/supabase-client'
import { useProfile } from '../../lib/hooks'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Overview', href: '/overview', icon: Search },
      { label: 'Rank History', href: '/rank-history', icon: BarChart3 },
    ],
  },
]

// Package tier order — used to determine if an upgrade is available
const PACKAGE_TIERS: Record<string, { order: number; next: string | null }> = {
  free:       { order: 0, next: 'Starter' },
  starter:    { order: 1, next: 'Pro' },
  pro:        { order: 2, next: 'Enterprise' },
  enterprise: { order: 3, next: null },
}

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function AppSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const [loggingOut, setLoggingOut] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null)

  const showTooltip = useCallback((label: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 8 })
  }, [])
  const hideTooltip = useCallback(() => setTooltip(null), [])

  const currentSlug = profile?.package?.slug || 'free'
  const tier = PACKAGE_TIERS[currentSlug] ?? PACKAGE_TIERS.free
  // Show upgrade CTA only when profile is loaded AND there's a higher tier
  const showUpgrade = !profileLoading && profile !== undefined && tier.next !== null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.includes('?')) {
      const basePath = href.split('?')[0]
      return pathname === basePath && typeof window !== 'undefined' && window.location.search.includes(href.split('?')[1])
    }
    return pathname?.startsWith(href) ?? false
  }

  const navigate = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authService.signOut()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  const sidebarWidth = isCollapsed ? 'w-[68px]' : 'w-[252px]'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full ${sidebarWidth}
          bg-white dark:bg-[#0f1117]
          border-r border-gray-200/80 dark:border-gray-800/80
          flex flex-col
          transition-all duration-200 ease-in-out
          overflow-x-hidden
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center h-[60px] px-4 border-b border-gray-100 dark:border-gray-800/80 shrink-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            {!isCollapsed && (
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight truncate">
                IndexNow
              </span>
            )}
          </button>
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand toggle when collapsed — below logo, centered */}
        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-gray-100 dark:border-gray-800/80 shrink-0">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              {!isCollapsed && (
                <div className="px-2.5 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                    {group.title}
                  </span>
                </div>
              )}
              {isCollapsed && <div className="mb-1" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <div
                      key={item.href}
                      onMouseEnter={(e) => isCollapsed && showTooltip(item.label, e.currentTarget)}
                      onMouseLeave={hideTooltip}
                    >
                      <button
                        onClick={() => navigate(item.href)}
                        className={`
                          w-full flex items-center gap-2.5 rounded-lg transition-all duration-150
                          ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'}
                          ${active
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                          }
                        `}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                        {!isCollapsed && (
                          <span className="text-[13px] font-medium truncate">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-100 dark:border-gray-800/80 shrink-0">
          {/* Account: Settings */}
          <div className="px-2.5 pt-2.5">
            {!isCollapsed ? (
              <button
                onClick={() => navigate('/settings')}
                className={`
                  w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150
                  ${isActive('/settings')
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Settings className={`w-[18px] h-[18px] shrink-0 ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span className="text-[13px] font-medium truncate">Settings</span>
              </button>
            ) : (
              <div
                className="flex justify-center"
                onMouseEnter={(e) => showTooltip('Settings', e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <button
                  onClick={() => navigate('/settings')}
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                    ${isActive('/settings')
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Settings className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </div>

          {/* Upgrade CTA — shows when a higher tier exists */}
          {showUpgrade && !isCollapsed && (
            <div className="px-3 pt-3">
              <div className="rounded-xl p-3.5 border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Upgrade to {tier.next}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1 mb-2.5">
                  Unlock more keywords and advanced features.
                </p>
                <button
                  onClick={() => navigate('/settings?tab=plans-billing')}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  Upgrade now
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Upgrade icon when collapsed */}
          {showUpgrade && isCollapsed && (
            <div
              className="px-2.5 pt-3 flex justify-center"
              onMouseEnter={(e) => showTooltip(`Upgrade to ${tier.next}`, e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <button
                onClick={() => navigate('/settings?tab=plans-billing')}
                className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sign Out */}
          <div className="px-2.5 py-3">
            {!isCollapsed ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
              >
                <LogOut className="w-[18px] h-[18px]" />
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            ) : (
              <div
                className="flex justify-center"
                onMouseEnter={(e) => showTooltip('Sign Out', e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Portal tooltip — rendered on document.body to escape overflow clipping */}
      {tooltip && createPortal(
        <div
          className="fixed z-[9999] px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg pointer-events-none"
          style={{ top: tooltip.top, left: tooltip.left, transform: 'translateY(-50%)' }}
        >
          {tooltip.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
        </div>,
        document.body
      )}
    </>
  )
}
