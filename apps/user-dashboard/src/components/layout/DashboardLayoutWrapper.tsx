'use client'

import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Sidebar, DashboardHeader } from '@indexnow/ui'
import { useDomain } from '@indexnow/ui/contexts'

/**
 * Auth routes that should NOT have the dashboard sidebar/chrome.
 * These render their own full-page layouts (centered login form, etc.).
 */
const AUTH_ROUTES = ['/login', '/register', '/resend-verification']

/**
 * DashboardLayoutWrapper — conditionally wraps authenticated pages with
 * Sidebar + DashboardHeader.
 *
 * Auth pages (/login, /register, /resend-verification) render without any chrome.
 * All other pages get the full dashboard shell.
 */
export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Domain context — provides all domain-related state for the header
  const {
    domains,
    selectedDomainId,
    selectedDomainInfo,
    setSelectedDomainId,
    getDomainKeywordCount,
    isDomainSelectorOpen,
    setIsDomainSelectorOpen,
  } = useDomain()

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const toggleCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])
  const toggleDomainSelector = useCallback(
    () => setIsDomainSelectorOpen(!isDomainSelectorOpen),
    [isDomainSelectorOpen, setIsDomainSelectorOpen]
  )

  const isAuthPage = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  // Auth pages — no sidebar/header, render children directly
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
        {/* Dashboard header — domain selector, add keywords, notifications */}
        <DashboardHeader
          domains={domains.map(d => ({ id: d.id, domain_name: d.domain, display_name: d.name }))}
          selectedDomainId={selectedDomainId}
          selectedDomainInfo={
            selectedDomainInfo
              ? { id: selectedDomainInfo.id, domain_name: selectedDomainInfo.domain, display_name: selectedDomainInfo.name }
              : { id: '', domain_name: '', display_name: '' }
          }
          isDomainSelectorOpen={isDomainSelectorOpen}
          onDomainSelectorToggle={toggleDomainSelector}
          onDomainSelect={setSelectedDomainId}
          getDomainKeywordCount={getDomainKeywordCount}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
