'use client';

import Link from 'next/link';
import {
  RefreshCw, Users, ShoppingCart, Zap, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks';
import { useAdminPageViewLogger, useAdminDashboardLogger } from '@indexnow/ui';

function StatCard({
  icon: Icon, iconBg, iconColor, value, label, sub, href, alert,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
  sub?: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 group hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {href && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      <div className={`text-[28px] font-bold mt-4 tabular-nums leading-none ${alert && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500 mt-1.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function SectionCard({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {href && (
          <Link href={href} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View all &rarr;
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent || 'text-gray-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  useAdminPageViewLogger('dashboard', 'Overview');
  const { logStatsRefresh } = useAdminDashboardLogger();
  const { data: stats, isLoading, isFetching, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 w-16 bg-gray-100 rounded mt-4 animate-pulse" />
              <div className="h-4 w-24 bg-gray-50 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor your platform at a glance</p>
        </div>
        <button
          onClick={() => { refetch(); logStatsRefresh(); }}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600"
          value={stats?.users.total ?? 0} label="Total Users"
          sub={`+${stats?.users.newThisWeek ?? 0} this week`} href="/users"
        />
        <StatCard
          icon={ShoppingCart} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          value={stats?.transactions.total ?? 0} label="Total Orders"
          sub={`${stats?.transactions.pendingCount ?? 0} pending`} href="/orders"
        />
        <StatCard
          icon={Zap} iconBg="bg-violet-50" iconColor="text-violet-600"
          value={stats?.users.activeToday ?? 0} label="Active Today"
          sub={`${stats?.keywords.checkedToday ?? 0} keywords checked`}
        />
        <StatCard
          icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600"
          value={stats?.errors.critical ?? 0} label="Critical Errors"
          sub={`${stats?.errors.unresolved ?? 0} unresolved`} href="/errors" alert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Users" href="/users">
          <MetricRow label="Total registered" value={stats?.users.total ?? 0} />
          <MetricRow label="New this week" value={stats?.users.newThisWeek ?? 0} accent="text-blue-600" />
          <MetricRow label="Active today" value={stats?.users.activeToday ?? 0} accent="text-emerald-600" />
        </SectionCard>

        <SectionCard title="Orders" href="/orders">
          <MetricRow label="All time" value={stats?.transactions.total ?? 0} />
          <MetricRow label="Completed this month" value={stats?.transactions.completedThisMonth ?? 0} accent="text-emerald-600" />
          <MetricRow label="Pending" value={stats?.transactions.pendingCount ?? 0} accent="text-amber-600" />
        </SectionCard>

        <SectionCard title="Rank Tracking">
          <MetricRow label="Total keywords" value={stats?.keywords.total ?? 0} />
          <MetricRow label="Checked today" value={stats?.keywords.checkedToday ?? 0} accent="text-violet-600" />
        </SectionCard>

        <SectionCard title="System Health" href="/errors">
          <MetricRow label="Critical errors" value={stats?.errors.critical ?? 0} accent={(stats?.errors.critical ?? 0) > 0 ? 'text-red-600' : undefined} />
          <MetricRow label="Unresolved" value={stats?.errors.unresolved ?? 0} accent={(stats?.errors.unresolved ?? 0) > 0 ? 'text-amber-600' : undefined} />
          <MetricRow label="Last 24 hours" value={stats?.errors.last24h ?? 0} />
        </SectionCard>
      </div>
    </div>
  );
}
