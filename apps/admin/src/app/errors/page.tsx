'use client';

import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminErrorStats, type TimeRange } from '@/hooks';

function severityColor(severity: string) {
  if (severity === 'critical') return 'text-red-600 dark:text-red-400';
  if (severity === 'high') return 'text-orange-600 dark:text-orange-400';
  if (severity === 'medium') return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-500 dark:text-gray-400';
}

function SummaryCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
    </div>
  );
}

export default function ErrorLogsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useAdminErrorStats(timeRange);

  const stats = data?.stats ?? null;
  const criticalErrors = data?.criticalErrors ?? [];

  const trendLabel = stats?.trend
    ? `${stats.trend.direction === 'up' ? '+' : stats.trend.direction === 'down' ? '-' : ''}${Math.abs(stats.trend.value).toFixed(1)}% vs prev. period`
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Error Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            System errors and critical events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden text-sm">
            {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 transition-colors ${
                  timeRange === r
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {r === '24h' ? '24h' : r === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
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
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading error data…</div>
      ) : (
        <>
          {/* Summary Stats */}
          {stats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <SummaryCard label="Total errors" value={stats.summary.totalErrors} sub={trendLabel ?? undefined} />
                <SummaryCard label="Critical" value={stats.summary.criticalErrors} />
                <SummaryCard label="High severity" value={stats.summary.highErrors} />
                <SummaryCard label="Unresolved" value={stats.summary.unresolvedErrors} />
              </div>
            </div>
          )}

          {/* Top Error Types */}
          {stats?.topErrors && stats.topErrors.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top error types</h2>
              <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topErrors.map((err, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-300">{err.error_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[320px] truncate">{err.message}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs capitalize ${severityColor(err.severity)}`}>{err.severity}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right tabular-nums">
                          {err.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Critical Errors */}
          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Critical errors
              {criticalErrors.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">({criticalErrors.length})</span>
              )}
            </h2>
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {criticalErrors.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No critical errors found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-6"></th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type / Endpoint</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalErrors.map((err) => {
                      const isExpanded = expandedId === err.id;
                      return (
                        <>
                          <tr
                            key={err.id}
                            onClick={() => setExpandedId(isExpanded ? null : err.id)}
                            className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-mono text-gray-600 dark:text-gray-300">{err.error_type}</div>
                              {err.endpoint && (
                                <div className="text-xs text-gray-400 mt-0.5">{err.http_method} {err.endpoint}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[280px] truncate">{err.message}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs capitalize ${severityColor(err.severity)}`}>{err.severity}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">
                              {new Date(err.created_at).toLocaleString()}
                            </td>
                          </tr>
                          {isExpanded && err.stack_trace && (
                            <tr key={`${err.id}-detail`} className="border-b border-gray-50 dark:border-gray-800/50">
                              <td colSpan={5} className="px-4 py-3">
                                <pre className="text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md overflow-x-auto max-h-48">
                                  {err.stack_trace}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
