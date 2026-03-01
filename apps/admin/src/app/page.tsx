'use client';

import Link from 'next/link';
import {
  RefreshCw, Users, AlertTriangle, Receipt, Key,
  TrendingUp, CheckCircle, Clock, BarChart2, ArrowRight,
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks';

function StatCard({
  label, value, sub, icon: Icon, href,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; href?: string;
}) {
  const body = (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <div className="text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <Icon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        {href && <ArrowRight className="w-3 h-3 ml-auto text-gray-300 dark:text-gray-600" />}
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function SectionLabel({ label, href }: { label: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h2>
      {href && (
        <Link href={href} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-0.5 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5 animate-pulse">
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      <div className="h-3.5 w-28 bg-gray-100 dark:bg-gray-700/50 rounded" />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, isFetching, refetch } = useAdminDashboard();

  return (
    <div className="space-y-10">
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
        <div className="space-y-10">
          {[3, 3, 2, 3].map((n, s) => (
            <section key={s}>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <section>
            <SectionLabel label="Users" href="/users" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total users"   value={stats?.users.total ?? 0}       icon={Users}       href="/users" />
              <StatCard label="New this week" value={stats?.users.newThisWeek ?? 0} icon={TrendingUp}  href="/users" />
              <StatCard label="Active today"  value={stats?.users.activeToday ?? 0} icon={CheckCircle} sub="based on activity logs" />
            </div>
          </section>

          <section>
            <SectionLabel label="Orders" href="/orders" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total orders"         value={stats?.transactions.total ?? 0}              icon={Receipt}     href="/orders" />
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

          <section>
            <SectionLabel label="Rank Tracking" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total keywords" value={stats?.keywords.total ?? 0}        icon={Key} />
              <StatCard label="Checked today"  value={stats?.keywords.checkedToday ?? 0} icon={BarChart2} sub="rank checks run today" />
            </div>
          </section>

          <section>
            <SectionLabel label="Error Logs" href="/errors" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Critical"       value={stats?.errors.critical ?? 0}   icon={AlertTriangle} sub="unresolved critical" href="/errors" />
              <StatCard label="Unresolved"     value={stats?.errors.unresolved ?? 0} icon={AlertTriangle} href="/errors" />
              <StatCard label="Last 24 hours"  value={stats?.errors.last24h ?? 0}    icon={AlertTriangle} href="/errors" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
