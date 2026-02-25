'use client'

import { usePathname } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

const AUTH_ROUTES = ['/login', '/register', '/resend-verification']
const COLLAPSED_KEY = 'sidebar-collapsed'

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_KEY)
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }, [])

  const isAuthPage = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  if (isAuthPage) {
    return <>{children}</>
  }

  const marginLeft = isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[252px]'

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#090a0f]">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className={`${marginLeft} min-h-screen flex flex-col transition-all duration-200`}>
        <AppHeader onMenuClick={openSidebar} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
