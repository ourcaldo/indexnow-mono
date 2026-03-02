'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { authService } from '@indexnow/supabase-client';
import { useSiteName } from '@indexnow/database/client';

interface NavLink {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const mainNav: NavLink[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Orders', href: '/orders', icon: Receipt },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Errors', href: '/errors', icon: AlertTriangle },
];

const settingsNav: NavLink[] = [
  { label: 'Site', href: '/settings/site', icon: Globe },
  { label: 'Packages', href: '/settings/packages', icon: Package },
  { label: 'Payments', href: '/settings/payments', icon: CreditCard },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const siteName = useSiteName();
  const settingsActive = settingsNav.some((s) => isActive(pathname, s.href));
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-52 flex-shrink-0 border-r border-white/[0.06] bg-[#0e0e18] flex flex-col h-screen">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.06]">
        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white leading-none">A</span>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white truncate leading-tight">
            {siteName || 'IndexNow'}
          </p>
          <p className="text-[10px] text-gray-500 leading-tight">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {mainNav.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[13px] transition-colors ${
                active
                  ? 'bg-white/[0.07] text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Settings group */}
        <div className="pt-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-full flex items-center justify-between px-2.5 py-[7px] rounded-md text-[13px] transition-colors ${
              settingsActive
                ? 'text-gray-200 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${settingsOpen ? '' : '-rotate-90'}`}
            />
          </button>
          {settingsOpen && (
            <div className="mt-0.5 ml-4 pl-2.5 border-l border-white/[0.06] space-y-0.5">
              {settingsNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[13px] transition-colors ${
                      active
                        ? 'text-white font-medium'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[13px] text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
