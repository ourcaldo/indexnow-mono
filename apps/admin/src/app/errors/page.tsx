'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, AlertOctagon, ShieldAlert, Eye, CheckCircle2 } from 'lucide-react';
import { useAdminErrorStats, type TimeRange, type CriticalError } from '@/hooks';
import { format } from 'date-fns';

function StatBadge({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`text-2xl font-bold tabular-nums ${accent || 'text-gray-900'}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function ErrorsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const { data, isLoading, isFetching, refetch } = useAdminErrorStats(timeRange);
  const stats = data?.stats;
  const criticalErrors = data?.criticalErrors ?? [];

  const TrendIcon = stats?.trend?.direction === 'up' ? TrendingUp : stats?.trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = stats?.trend?.direction === 'up' ? 'text-red-600' : stats?.trend?.direction === 'down' ? 'text-emerald-600' : 'text-gray-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Errors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats?.summary?.totalErrors?.toLocaleString() ?? 0} total in selected range</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
          <button key={range} onClick={() => setTimeRange(range)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >{range}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBadge label="Total errors" value={stats?.summary?.totalErrors ?? 0} />
            <StatBadge label="Critical" value={stats?.summary?.criticalErrors ?? 0} accent={(stats?.summary?.criticalErrors ?? 0) > 0 ? 'text-red-600' : undefined} />
            <StatBadge label="High" value={stats?.summary?.highErrors ?? 0} />
            <StatBadge label="Unresolved" value={stats?.summary?.unresolvedErrors ?? 0} accent={(stats?.summary?.unresolvedErrors ?? 0) > 0 ? 'text-amber-600' : undefined} />
          </div>

          {stats?.trend && (
            <div className="flex items-center gap-2 px-1">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className="text-sm text-gray-600">
                {stats.trend.currentPeriodCount} current vs {stats.trend.previousPeriodCount} previous period
              </span>
            </div>
          )}

          {stats?.topErrors && stats.topErrors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Top Errors</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Message</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Severity</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topErrors.map((err: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm text-gray-900 truncate max-w-[300px]">{err.message}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{err.error_type}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${
                            err.severity === 'critical' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                            err.severity === 'high' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                            'bg-gray-50 text-gray-600 ring-gray-500/20'
                          }`}>{err.severity}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 tabular-nums text-right">{err.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats?.distributions?.byEndpoint && stats.distributions.byEndpoint.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">By Endpoint</h3></div>
              <div className="px-5 py-1">
                {stats.distributions.byEndpoint.slice(0, 10).map((ep: any) => (
                  <div key={ep.endpoint} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 font-mono truncate max-w-[70%]">{ep.endpoint}</span>
                    <span className="text-sm text-gray-500 tabular-nums">{ep.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Critical Errors {criticalErrors.length > 0 && <span className="text-gray-400 font-normal ml-1">({criticalErrors.length})</span>}</h3>
            </div>
            {criticalErrors.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No critical errors</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Error</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalErrors.map((err: CriticalError) => (
                      <tr key={err.id} onClick={() => router.push(`/errors/${err.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 cursor-pointer transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-gray-900 truncate">{err.message}</div>
                          {err.endpoint && <div className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">{err.http_method} {err.endpoint}</div>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{err.error_type}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">{format(new Date(err.created_at), 'MMM d, HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
