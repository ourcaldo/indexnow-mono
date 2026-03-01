'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Activity,
  AlertTriangle,
  Settings,
  Globe,
  Package,
  CreditCard,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { authService } from '@indexnow/supabase-client';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@indexnow/database/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Orders', href: '/orders', icon: Receipt },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Error Logs', href: '/errors', icon: AlertTriangle },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Site', href: '/settings/site', icon: Globe },
      { label: 'Packages', href: '/settings/packages', icon: Package },
      { label: 'Payments', href: '/settings/payments', icon: CreditCard },
    ],
  },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const siteName = useSiteName();

  // Settings group open if any child is active
  const settingsChildren = ['/settings/site', '/settings/packages', '/settings/payments'];
  const settingsActive = settingsChildren.some((h) => pathname.startsWith(h));
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 dark:bg-[#0f0f17] dark:border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo / site name */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
          {siteName || 'IndexNow Studio'}
        </span>
        <span className="ml-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((entry, i) => {
          if (isGroup(entry)) {
            return (
              <div key={i}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    settingsActive
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <entry.icon className="w-4 h-4" />
                    {entry.label}
                  </span>
                  {settingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                {settingsOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
                    {entry.children.map((child) => {
                      const active = isActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                            active
                              ? 'text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(pathname, entry.href, entry.exact);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <entry.icon className="w-4 h-4" />
              {entry.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
