'use client';

import Link from 'next/link';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useAdminDashboard } from '@/hooks';

function Metric({
  value,
  label,
  alert,
}: {
  value: number;
  label: string;
  alert?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`text-2xl font-semibold tabular-nums tracking-tight ${
          alert && value > 0 ? 'text-red-400' : 'text-white'
        }`}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] text-gray-500 hover:text-white transition-colors"
    >
      {label}
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isFetching, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-28 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-40 bg-white/5 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">System overview</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-400 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-gray-200 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
        <Metric value={stats?.users.total ?? 0} label="Total users" />
        <Metric value={stats?.users.newThisWeek ?? 0} label="New this week" />
        <Metric value={stats?.users.activeToday ?? 0} label="Active today" />
        <Metric value={stats?.transactions.total ?? 0} label="Total orders" />
        <Metric value={stats?.transactions.pendingCount ?? 0} label="Pending orders" />
        <Metric value={stats?.errors.critical ?? 0} label="Critical errors" alert />
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Users */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Users</h2>
            <SectionLink href="/users" label="View all" />
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-white font-medium tabular-nums">
                {(stats?.users.total ?? 0).toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1.5">total</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.users.newThisWeek ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">new this week</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.users.activeToday ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">active today</span>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.06]" />

        {/* Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Orders</h2>
            <SectionLink href="/orders" label="View all" />
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-white font-medium tabular-nums">
                {(stats?.transactions.total ?? 0).toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1.5">total</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.transactions.completedThisMonth ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">completed this month</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.transactions.pendingCount ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">pending</span>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.06]" />

        {/* Rank Tracking */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white">Rank Tracking</h2>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-white font-medium tabular-nums">
                {(stats?.keywords.total ?? 0).toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1.5">keywords</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.keywords.checkedToday ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">checked today</span>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.06]" />

        {/* Errors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white">Errors</h2>
            <SectionLink href="/errors" label="View all" />
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span
                className={`font-medium tabular-nums ${
                  (stats?.errors.critical ?? 0) > 0 ? 'text-red-400' : 'text-white'
                }`}
              >
                {stats?.errors.critical ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">critical</span>
            </div>
            <div>
              <span
                className={`font-medium tabular-nums ${
                  (stats?.errors.unresolved ?? 0) > 0 ? 'text-amber-400' : 'text-white'
                }`}
              >
                {stats?.errors.unresolved ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">unresolved</span>
            </div>
            <div>
              <span className="text-white font-medium tabular-nums">
                {stats?.errors.last24h ?? 0}
              </span>
              <span className="text-gray-500 ml-1.5">last 24h</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
