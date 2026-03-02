'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAdminErrorStats, type TimeRange, type CriticalError } from '@/hooks';
import { format } from 'date-fns';

export default function ErrorsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const { data, isLoading, isFetching, refetch } = useAdminErrorStats(timeRange);
  const stats = data?.stats;
  const criticalErrors = data?.criticalErrors ?? [];

  const TrendIcon =
    stats?.trend?.direction === 'up'
      ? TrendingUp
      : stats?.trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Errors</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {stats?.summary?.totalErrors?.toLocaleString() ?? 0} total in range
          </p>
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

      {/* Time range */}
      <div className="flex items-center gap-2">
        {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
              timeRange === range
                ? 'bg-white/[0.07] text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-semibold text-white tabular-nums">
                {stats?.summary?.totalErrors?.toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Total errors</div>
            </div>
            <div>
              <div
                className={`text-2xl font-semibold tabular-nums ${
                  (stats?.summary?.criticalErrors ?? 0) > 0 ? 'text-red-400' : 'text-white'
                }`}
              >
                {stats?.summary?.criticalErrors ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tabular-nums">
                {stats?.summary?.highErrors ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">High</div>
            </div>
            <div>
              <div
                className={`text-2xl font-semibold tabular-nums ${
                  (stats?.summary?.unresolvedErrors ?? 0) > 0 ? 'text-amber-400' : 'text-white'
                }`}
              >
                {stats?.summary?.unresolvedErrors ?? 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Unresolved</div>
            </div>
          </div>

          {/* Trend */}
          {stats?.trend && (
            <div className="flex items-center gap-2 text-sm">
              <TrendIcon
                className={`w-4 h-4 ${
                  stats.trend.direction === 'up'
                    ? 'text-red-400'
                    : stats.trend.direction === 'down'
                      ? 'text-emerald-400'
                      : 'text-gray-500'
                }`}
              />
              <span className="text-gray-400">
                {stats.trend.currentPeriodCount} current vs {stats.trend.previousPeriodCount}{' '}
                previous
              </span>
            </div>
          )}

          <div className="border-t border-white/[0.06]" />

          {/* Top error types */}
          {stats?.topErrors && stats.topErrors.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-white mb-3">Top errors</h2>
              <div>
                <div className="grid grid-cols-[1fr_100px_80px_60px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
                  <span>Message</span>
                  <span>Type</span>
                  <span>Severity</span>
                  <span className="text-right">Count</span>
                </div>
                <div className="border-t border-white/[0.04]">
                  {stats.topErrors.map((err, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_100px_80px_60px] gap-4 px-3 py-2.5 border-b border-white/[0.04] last:border-0"
                    >
                      <span className="text-[13px] text-gray-300 truncate">{err.message}</span>
                      <span className="text-[12px] text-gray-500 truncate">{err.error_type}</span>
                      <span
                        className={`text-[12px] ${
                          err.severity === 'critical'
                            ? 'text-red-400'
                            : err.severity === 'high'
                              ? 'text-amber-400'
                              : 'text-gray-500'
                        }`}
                      >
                        {err.severity}
                      </span>
                      <span className="text-[13px] text-white font-medium tabular-nums text-right">
                        {err.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* By endpoint */}
          {stats?.distributions?.byEndpoint && stats.distributions.byEndpoint.length > 0 && (
            <>
              <div className="border-t border-white/[0.06]" />
              <section>
                <h2 className="text-sm font-medium text-white mb-3">By endpoint</h2>
                <div className="space-y-1">
                  {stats.distributions.byEndpoint.slice(0, 10).map((ep) => (
                    <div
                      key={ep.endpoint}
                      className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                    >
                      <span className="text-[13px] text-gray-300 font-mono truncate max-w-[70%]">
                        {ep.endpoint}
                      </span>
                      <span className="text-[13px] text-gray-400 tabular-nums">{ep.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="border-t border-white/[0.06]" />

          {/* Critical errors list */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">
              Recent critical errors
              {criticalErrors.length > 0 && (
                <span className="text-gray-500 font-normal ml-1.5">({criticalErrors.length})</span>
              )}
            </h2>

            {criticalErrors.length === 0 ? (
              <p className="text-sm text-gray-600 py-4">No critical errors</p>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_100px_120px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
                  <span>Error</span>
                  <span>Type</span>
                  <span>Time</span>
                </div>
                <div className="border-t border-white/[0.04]">
                  {criticalErrors.map((err: CriticalError) => (
                    <div
                      key={err.id}
                      onClick={() => router.push(`/errors/${err.id}`)}
                      className="grid grid-cols-[1fr_100px_120px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] text-gray-200 truncate">{err.message}</div>
                        {err.endpoint && (
                          <div className="text-[11px] text-gray-600 font-mono mt-0.5 truncate">
                            {err.http_method} {err.endpoint}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-[12px] text-gray-500 truncate">
                        {err.error_type}
                      </div>
                      <div className="flex items-center text-[12px] text-gray-600 tabular-nums">
                        {format(new Date(err.created_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
