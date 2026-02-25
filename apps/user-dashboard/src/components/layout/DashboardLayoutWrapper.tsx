'use client'

import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Sidebar } from '@indexnow/ui'

/**
 * Auth routes that should NOT have the dashboard sidebar/chrome.
 * These render their own full-page layouts (centered login form, etc.).
 */
const AUTH_ROUTES = ['/login', '/register', '/resend-verification']

/**
 * DashboardLayoutWrapper — conditionally wraps authenticated pages with Sidebar.
 *
 * Auth pages (/login, /register, /resend-verification) render without any chrome.
 * All other pages get the sidebar navigation + padded main content area.
 */
export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const toggleCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])

  const isAuthPage = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  // Auth pages — no sidebar, render children directly
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — self-contained: fetches its own data, navigation, logout */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onCollapse={toggleCollapse}
      />

      {/* Main content area — shifts right based on sidebar width */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Mobile top bar — hamburger toggle (desktop sidebar is always visible) */}
        <div className="lg:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <span className="text-lg font-semibold text-foreground">IndexNow Studio</span>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
