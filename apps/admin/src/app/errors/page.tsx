'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminErrorStats, useAdminErrorList, type TimeRange, type SeverityFilter, type ErrorLogEntry } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

function StatBadge({ label, value, accent, active, onClick }: {
  label: string; value: number; accent?: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${
        active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`text-2xl font-bold tabular-nums ${accent || 'text-gray-900'}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </button>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
  error: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  debug: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

export default function ErrorsPage() {
  useAdminPageViewLogger('errors', 'Error Logs');
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useAdminErrorStats(timeRange);
  const { data: listData, isLoading: listLoading } = useAdminErrorList(page, severity, timeRange);
  const stats = data?.stats;
  const errors = listData?.errors ?? [];
  const pagination = listData?.pagination;

  const TrendIcon = stats?.trend?.direction === 'up' ? TrendingUp : stats?.trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = stats?.trend?.direction === 'up' ? 'text-red-600' : stats?.trend?.direction === 'down' ? 'text-emerald-600' : 'text-gray-400';

  const handleSeverityClick = (s: SeverityFilter) => {
    setSeverity(s);
    setPage(1);
  };

  return (
    <div className="bg-white min-h-full">
      {/* ─── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Errors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats?.summary?.totalErrors?.toLocaleString() ?? 0} total in selected range
            {stats?.trend && (
              <span className={`inline-flex items-center gap-1 ml-2 ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span className="text-xs">{stats.trend.currentPeriodCount} vs {stats.trend.previousPeriodCount} prev</span>
              </span>
            )}
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Time range filter ───────────────────────────── */}
      <div className="px-8 py-3 border-b border-gray-200 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button key={range} onClick={() => { setTimeRange(range); setPage(1); }}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >{range}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-8 py-5 grid grid-cols-2 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 h-20 animate-pulse" />)}</div>
      ) : (
        <>
          {/* ─── Stat badges (clickable severity filters) ──── */}
          <div className="px-8 py-5 border-b border-gray-200 grid grid-cols-2 lg:grid-cols-6 gap-3">
            <StatBadge label="All Errors" value={stats?.summary?.totalErrors ?? 0} active={severity === 'all'} onClick={() => handleSeverityClick('all')} />
            <StatBadge label="Critical" value={stats?.summary?.criticalErrors ?? 0} accent={(stats?.summary?.criticalErrors ?? 0) > 0 ? 'text-red-600' : undefined} active={severity === 'critical'} onClick={() => handleSeverityClick('critical')} />
            <StatBadge label="Error" value={stats?.summary?.highErrors ?? 0} accent={(stats?.summary?.highErrors ?? 0) > 0 ? 'text-amber-600' : undefined} active={severity === 'error'} onClick={() => handleSeverityClick('error')} />
            <StatBadge label="Warning" value={stats?.summary?.warningErrors ?? 0} active={severity === 'warning'} onClick={() => handleSeverityClick('warning')} />
            <StatBadge label="Info / Debug" value={stats?.summary?.infoErrors ?? 0} active={severity === 'info'} onClick={() => handleSeverityClick('info')} />
            <StatBadge label="Unresolved" value={stats?.summary?.unresolvedErrors ?? 0} accent={(stats?.summary?.unresolvedErrors ?? 0) > 0 ? 'text-amber-600' : undefined} active={false} />
          </div>

          {/* ─── Errors table ────────────────────────────────── */}
          {listLoading ? (
            <div className="px-8 py-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : errors.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400">No errors found for this filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-8 pr-3 py-3 w-10">#</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-24">ID</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-20">Severity</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Message</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-28">Type</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-40">Endpoint</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-3 pr-8 py-3 w-32">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err: ErrorLogEntry, idx: number) => {
                      const rowNum = ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 50) + idx + 1;
                      return (
                        <tr key={err.id} onClick={() => router.push(`/errors/${err.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 cursor-pointer transition-colors">
                          <td className="pl-8 pr-3 py-3 text-xs text-gray-400 tabular-nums">{rowNum}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 font-mono">{err.id.slice(0, 8)}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.debug}`}>{err.severity}</span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-[350px]">{err.message}</td>
                          <td className="px-3 py-3 text-xs text-gray-500">{err.error_type}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 font-mono truncate max-w-[160px]">
                            {err.endpoint ? `${err.http_method || ''} ${err.endpoint}`.trim() : '\u2014'}
                          </td>
                          <td className="pl-3 pr-8 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">{format(new Date(err.created_at), 'MMM d, HH:mm')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── Pagination ────────────────────────────────── */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} errors)</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
