'use client'

import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { id: 'profile', label: 'My Profile', href: '/settings/profile' },
  { id: 'security', label: 'Security', href: '/settings/security' },
  { id: 'notifications', label: 'Notifications', href: '/settings/notifications' },
  { id: 'billing', label: 'Billing', href: '/settings/billing' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Determine active section from pathname
  const activeId = navItems.find((n) => pathname.startsWith(n.href))?.id ?? 'profile'

  const handleNav = (href: string) => {
    router.push(href, { scroll: false })
  }

  return (
    <div className="-m-4 lg:-m-6 bg-white border-t border-gray-200 min-h-[calc(100vh-60px)]">
      <div className="flex min-h-[calc(100vh-60px)]">
        {/* ── Settings Sidebar ── */}
        <nav className="w-52 shrink-0 border-r border-gray-200 hidden md:block p-5">
          <ul className="space-y-0.5 sticky top-6">
            {navItems.map((item) => {
              const isActive = activeId === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.href)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
        <div className="md:hidden flex gap-1 px-4 pt-4 pb-3 border-b border-gray-200/80 overflow-x-auto w-full">
          {navItems.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.href)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0 p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
