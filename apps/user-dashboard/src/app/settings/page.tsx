'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePageViewLogger } from '@indexnow/ui/hooks'
import ProfileContent from './general/ProfileContent'
import SecurityContent from './general/SecurityContent'
import NotificationsContent from './general/NotificationsContent'
import BillingContent from './billing/PlansBillingContent'

const navItems = [
  { id: 'profile', label: 'My Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'billing', label: 'Billing' },
]

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('profile')

  usePageViewLogger('/settings', 'Settings', { section: 'user_settings' })

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) {
      // Support legacy tab= params
      if (tab === 'general') setActiveSection('profile')
      else if (tab === 'plans-billing' || tab === 'plans') setActiveSection('billing')
      else if (navItems.some((n) => n.id === tab)) setActiveSection(tab)
    }
  }, [searchParams])

  const handleNav = (id: string) => {
    setActiveSection(id)
    router.push(`/settings?tab=${id}`, { scroll: false })
  }

  return (
    <div className="-m-4 lg:-m-6 bg-white dark:bg-[#0f1017] border-t border-gray-200 dark:border-gray-800 min-h-[calc(100vh-60px)]">
      <div className="flex min-h-[calc(100vh-60px)]">
        {/* ── Settings Sidebar ── */}
        <nav className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 hidden md:block p-5">
          <ul className="space-y-0.5 sticky top-6">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-900 dark:text-white font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Mobile nav (horizontal scroll) ── */}
        <div className="md:hidden flex gap-1 px-4 pt-4 pb-3 border-b border-gray-200/80 dark:border-gray-800/60 overflow-x-auto w-full">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0 p-6 md:p-8">
          {/* Section title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {navItems.find((n) => n.id === activeSection)?.label}
          </h2>

          {/* Section content */}
          {activeSection === 'profile' && <ProfileContent />}
          {activeSection === 'security' && <SecurityContent />}
          {activeSection === 'notifications' && <NotificationsContent />}
          {activeSection === 'billing' && <BillingContent />}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />}>
      <SettingsPageContent />
    </Suspense>
  )
}
