'use client';

import Link from 'next/link';
import {
  RefreshCw, Users, AlertTriangle, Receipt, Key,
  TrendingUp, CheckCircle, Clock, BarChart2, ArrowUpRight,
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks';

function KpiItem({ label, value, href, alert }: { label: string; value: number | string; href?: string; alert?: boolean }) {
  const text = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="flex-1 min-w-0 px-5 py-4 first:pl-0 last:pr-0">
      {href ? (
        <Link href={href} className="group block">
          <div className={`text-2xl font-bold tabular-nums tracking-tight ${alert && Number(value) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{text}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <ArrowUpRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ) : (
        <div>
          <div className={`text-2xl font-bold tabular-nums tracking-tight ${alert && Number(value) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{text}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-gray-200 dark:bg-gray-800 my-3" />;
}

function StatRow({ label, items, href }: {
  label: string;
  items: { key: string; value: number | string; sub?: string; alert?: boolean }[];
  href?: string;
}) {
  return (
    <div className="flex items-start gap-0 border-b border-gray-100 dark:border-gray-800/60 last:border-0 py-4">
      <div className="w-32 flex-shrink-0 pt-0.5">
        {href ? (
          <Link href={href} className="group flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            {label}
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map((item) => (
          <div key={item.key}>
            <span className={`text-sm font-semibold tabular-nums ${item.alert && Number(item.value) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{item.key}</span>
            {item.sub && <div className="text-xs text-gray-400 dark:text-gray-500">{item.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, isFetching, refetch } = useAdminDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">System overview</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 flex gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex-1">
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-6">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg px-5">
            <div className="flex items-stretch">
              <KpiItem label="Total users"    value={stats?.users.total ?? 0}              href="/users" />
              <Divider />
              <KpiItem label="New this week"  value={stats?.users.newThisWeek ?? 0}        href="/users" />
              <Divider />
              <KpiItem label="Total orders"   value={stats?.transactions.total ?? 0}       href="/orders" />
              <Divider />
              <KpiItem label="Pending"        value={stats?.transactions.pendingCount ?? 0} href="/orders" />
              <Divider />
              <KpiItem label="Critical errors" value={stats?.errors.critical ?? 0}         href="/errors" alert />
              <Divider />
              <KpiItem label="Keywords tracked" value={stats?.keywords.total ?? 0} />
            </div>
          </div>

          {/* Detail rows */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg px-5">
            <StatRow
              label="Users"
              href="/users"
              items={[
                { key: 'total', value: stats?.users.total ?? 0 },
                { key: 'new this week', value: stats?.users.newThisWeek ?? 0 },
                { key: 'active today', value: stats?.users.activeToday ?? 0, sub: 'from activity logs' },
              ]}
            />
            <StatRow
              label="Orders"
              href="/orders"
              items={[
                { key: 'total', value: stats?.transactions.total ?? 0 },
                { key: 'completed this month', value: stats?.transactions.completedThisMonth ?? 0 },
                { key: 'pending', value: stats?.transactions.pendingCount ?? 0, sub: stats?.transactions.pendingCount ? 'awaiting confirmation' : 'none pending' },
              ]}
            />
            <StatRow
              label="Rank Tracking"
              items={[
                { key: 'keywords', value: stats?.keywords.total ?? 0 },
                { key: 'checked today', value: stats?.keywords.checkedToday ?? 0 },
              ]}
            />
            <StatRow
              label="Errors"
              href="/errors"
              items={[
                { key: 'critical', value: stats?.errors.critical ?? 0, alert: true },
                { key: 'unresolved', value: stats?.errors.unresolved ?? 0, alert: true },
                { key: 'last 24h', value: stats?.errors.last24h ?? 0 },
              ]}
            />
          </div>

          {/* Quick nav */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Manage users', href: '/users', icon: Users },
              { label: 'View orders', href: '/orders', icon: Receipt },
              { label: 'Activity log', href: '/activity', icon: BarChart2 },
              { label: 'Error logs', href: '/errors', icon: AlertTriangle },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}