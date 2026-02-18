'use client';

import { useEffect } from 'react';
import {
  Users,
  Activity,
  Briefcase,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { AdminPageSkeleton } from '@indexnow/ui';
import { useAdminDashboardLogger } from '@indexnow/ui/hooks';
import { useAdminDashboard } from '@/hooks';

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = useAdminDashboard();
  const { logDashboardView, logStatsRefresh } = useAdminDashboardLogger();

  useEffect(() => {
    logDashboardView();
  }, []);

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      subtitle: `${stats?.regular_users || 0} regular, ${stats?.admin_users || 0} admin`,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of IndexNow Studio system metrics</p>
        </div>
        <button
          onClick={() => {
            refetch();
            logStatsRefresh();
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-background border-border rounded-lg border p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            <div>
              <h3 className="text-foreground mb-1 text-2xl font-bold">
                {card.value.toLocaleString()}
              </h3>
              <p className="text-foreground mb-1 text-sm font-medium">{card.title}</p>
              <p className="text-muted-foreground text-xs">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="bg-background border-border rounded-lg border p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold">System Status</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center space-x-3">
            <div className="bg-success h-3 w-3 rounded-full"></div>
            <span className="text-muted-foreground text-sm">Database Connection</span>
            <span className="text-success text-sm font-medium">Healthy</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-success h-3 w-3 rounded-full"></div>
            <span className="text-muted-foreground text-sm">Background Worker</span>
            <span className="text-success text-sm font-medium">Running</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-background border-border rounded-lg border p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/users"
            className="border-border hover:bg-secondary flex items-center rounded-lg border p-4 transition-colors"
          >
            <Users className="text-accent mr-3 h-5 w-5" />
            <span className="text-foreground text-sm font-medium">Manage Users</span>
          </Link>
          <Link
            href="/activity"
            className="border-border hover:bg-secondary flex items-center rounded-lg border p-4 transition-colors"
          >
            <Activity className="text-success mr-3 h-5 w-5" />
            <span className="text-foreground text-sm font-medium">View Logs</span>
          </Link>
          <Link
            href="/settings/site"
            className="border-border hover:bg-secondary flex items-center rounded-lg border p-4 transition-colors"
          >
            <Server className="text-warning mr-3 h-5 w-5" />
            <span className="text-foreground text-sm font-medium">Site Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
