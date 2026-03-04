'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Activity,
  AlertTriangle,
  Globe,
  Package,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { authService } from '@indexnow/supabase-client';
import { useSiteName } from '@indexnow/database/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const mainNav: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Orders', href: '/orders', icon: Receipt },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Errors', href: '/errors', icon: AlertTriangle },
];

const settingsNav: NavItem[] = [
  { label: 'Site', href: '/settings/site', icon: Globe },
  { label: 'Packages', href: '/settings/packages', icon: Package },
  { label: 'Payments', href: '/settings/payments', icon: CreditCard },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href, item.exact);
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <item.icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const siteName = useSiteName();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authService.signOut();
    } catch {
      // Swallow — we're redirecting regardless
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-screen">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">IN</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {siteName || 'IndexNow'}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-3">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="mt-8">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Settings
          </p>
          <div className="space-y-1">
            {settingsNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
