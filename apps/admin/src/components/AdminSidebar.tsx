'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Receipt, Activity, AlertTriangle,
  Settings, Globe, Package, CreditCard, LogOut,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authService } from '@indexnow/supabase-client';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@indexnow/database/client';

interface NavItem { label: string; href: string; icon: React.ElementType; exact?: boolean; }
interface NavGroup { label: string; icon: React.ElementType; defaultHref: string; children: NavItem[]; }
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Orders', href: '/orders', icon: Receipt },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Error Logs', href: '/errors', icon: AlertTriangle },
  {
    label: 'Settings', icon: Settings, defaultHref: '/settings/packages',
    children: [
      { label: 'Site', href: '/settings/site', icon: Globe },
      { label: 'Packages', href: '/settings/packages', icon: Package },
      { label: 'Payments', href: '/settings/payments', icon: CreditCard },
    ],
  },
];

function isGroup(e: NavEntry): e is NavGroup { return 'children' in e; }
function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

const base = 'rounded-md transition-colors';
const activeCls = `${base} bg-gray-100 dark:bg-white/[0.07] text-gray-900 dark:text-white font-medium`;
const inactiveCls = `${base} text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60`;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const siteName = useSiteName();

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('admin-sidebar-collapsed') === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('admin-sidebar-collapsed', String(next)); } catch {}
  };

  const settingsPaths = ['/settings/site', '/settings/packages', '/settings/payments'];
  const settingsActive = settingsPaths.some((h) => pathname.startsWith(h));
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  const handleSignOut = async () => { await authService.signOut(); router.push('/login'); };

  const iconLink = (cls: string) => `flex items-center justify-center w-9 h-9 mx-auto ${cls}`;
  const rowLink = (cls: string) => `flex items-center gap-2.5 px-3 py-2 text-sm ${cls}`;

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-56'} flex-shrink-0 bg-white dark:bg-[#0f0f17] border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0 transition-all duration-200 ease-in-out overflow-hidden`}
    >
      {/* Logo */}
      <div className={`h-14 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2.5 flex-shrink-0 ${collapsed ? 'justify-center' : 'px-4'}`}>
        <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-white leading-none select-none">A</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {siteName || 'IndexNow Studio'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight">Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {NAV.map((entry, i) => {
          if (isGroup(entry)) {
            if (collapsed) {
              return (
                <Link
                  key={i}
                  href={entry.defaultHref}
                  title={entry.label}
                  className={iconLink(settingsActive ? activeCls : inactiveCls)}
                >
                  <entry.icon className="w-4 h-4" />
                </Link>
              );
            }
            return (
              <div key={i}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    settingsActive
                      ? 'text-gray-700 dark:text-gray-200 font-medium bg-gray-100 dark:bg-white/[0.05]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <entry.icon className="w-4 h-4" />
                    {entry.label}
                  </span>
                  {settingsOpen
                    ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
                {settingsOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
                    {entry.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={rowLink(isActive(pathname, child.href) ? activeCls : inactiveCls)}
                      >
                        <child.icon className="w-4 h-4" />
                        {child.label}
                      </Link>
                    ))}
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
              title={collapsed ? entry.label : undefined}
              className={collapsed ? iconLink(active ? activeCls : inactiveCls) : rowLink(active ? activeCls : inactiveCls)}
            >
              <entry.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && entry.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`py-3 border-t border-gray-200 dark:border-gray-800 space-y-0.5 flex-shrink-0 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={collapsed
            ? `${iconLink('text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-md transition-colors')}`
            : 'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors'
          }
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /><span>Collapse</span></>}
        </button>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={collapsed
            ? `${iconLink('text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors')}`
            : 'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors'
          }
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}