'use client';

import Link from 'next/link';
import { RefreshCw, Users, AlertTriangle, Receipt, Key, TrendingUp, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { useAdminDashboard } from '@/hooks';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  href?: string;
}) {
  const content = (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 flex items-start gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export default function AdminDashboard() {
  const { data: stats, isLoading, isFetching, refetch } = useAdminDashboard();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">System overview</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Section: Users */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Users</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total users" value={stats?.users.total ?? 0} icon={Users} href="/users" />
              <StatCard label="New this week" value={stats?.users.newThisWeek ?? 0} icon={TrendingUp} href="/users" />
              <StatCard label="Active today" value={stats?.users.activeToday ?? 0} icon={CheckCircle} sub="based on activity logs" />
            </div>
          </section>

          {/* Section: Orders */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Orders</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total orders" value={stats?.transactions.total ?? 0} icon={Receipt} href="/orders" />
              <StatCard label="Completed this month" value={stats?.transactions.completedThisMonth ?? 0} icon={CheckCircle} href="/orders" />
              <StatCard
                label="Pending"
                value={stats?.transactions.pendingCount ?? 0}
                icon={Clock}
                sub={stats?.transactions.pendingCount ? 'awaiting confirmation' : 'none pending'}
                href="/orders"
              />
            </div>
          </section>

          {/* Section: Keywords */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Rank Tracking</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total keywords" value={stats?.keywords.total ?? 0} icon={Key} />
              <StatCard label="Checked today" value={stats?.keywords.checkedToday ?? 0} icon={BarChart2} sub="rank checks run today" />
            </div>
          </section>

          {/* Section: Errors */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Errors</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Critical errors"
                value={stats?.errors.critical ?? 0}
                icon={AlertTriangle}
                sub="unresolved critical"
                href="/errors"
              />
              <StatCard
                label="Unresolved errors"
                value={stats?.errors.unresolved ?? 0}
                icon={AlertTriangle}
                href="/errors"
              />
              <StatCard
                label="Errors last 24h"
                value={stats?.errors.last24h ?? 0}
                icon={AlertTriangle}
                href="/errors"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

