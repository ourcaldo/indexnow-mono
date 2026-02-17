'use client'

import React, { useState } from 'react'

interface DashboardShellProps {
  children: React.ReactNode
  /** Sidebar component — receives isOpen, isCollapsed, onToggle, onCollapse */
  sidebar: React.ComponentType<{
    isOpen: boolean
    isCollapsed: boolean
    onToggle: () => void
    onCollapse: (collapsed: boolean) => void
  }>
  /** Optional header component — receives onToggleSidebar */
  header?: React.ComponentType<{
    onToggleSidebar: () => void
  }>
  /** Initial collapsed state for sidebar (default: false) */
  defaultCollapsed?: boolean
}

/**
 * Shared dashboard shell with sidebar + optional header + main content area.
 * Both admin and user-dashboard apps can use this to avoid duplicating
 * layout composition logic.
 *
 * Usage in admin dashboard/layout.tsx:
 *   <DashboardShell sidebar={AdminSidebar}>{children}</DashboardShell>
 *
 * Usage in user-dashboard dashboard/layout.tsx:
 *   <DashboardShell sidebar={Sidebar} header={DashboardHeader}>
 *     {children}
 *   </DashboardShell>
 */
export function DashboardShell({
  children,
  sidebar: SidebarComponent,
  header: HeaderComponent,
  defaultCollapsed = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed)

  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarComponent
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onCollapse={setSidebarCollapsed}
      />

      {/* Main content area — shifts right based on sidebar width */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Optional header */}
        {HeaderComponent && (
          <HeaderComponent onToggleSidebar={toggleSidebar} />
        )}

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
