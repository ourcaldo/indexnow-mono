'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, ExternalLink, X, Eye, CheckCircle, Copy, Check } from 'lucide-react';
import { useAdminErrorStats, useAdminErrorList, useAdminErrorDetail, useErrorAction, type TimeRange, type SeverityFilter, type ErrorLogEntry } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

/** Safely display a message that might be an object or the literal string "[object Object]" */
function displayMessage(msg: unknown): string {
  if (msg === null || msg === undefined) return '—';
  if (typeof msg === 'string') {
    // Detect literal "[object Object]" stored in DB from bad serialization
    if (msg === '[object Object]' || msg.trim() === '[object Object]') return '(no message — serialization error)';
    return msg;
  }
  if (typeof msg === 'object') {
    const obj = msg as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    try { return JSON.stringify(msg); } catch { return String(msg); }
  }
  return String(msg);
}

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

/* ─── Copyable ID chip ───────────────────────────────────── */

function CopyableId({ id, label }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="inline-flex items-center gap-1.5 font-mono text-sm text-gray-700 hover:text-gray-900 transition-colors" title={`Copy ${label || 'ID'}`}>
      {id.slice(0, 12)}...
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

/* ─── Detail row ─────────────────────────────────────────── */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-3.5 py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  );
}

/* ─── Error slide-over panel ─────────────────────────────── */

function ErrorSlideOver({ errorId, onClose }: { errorId: string; onClose: () => void }) {
  const { data: errorDetail, isLoading } = useAdminErrorDetail(errorId);
  const errorAction = useErrorAction(errorId);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const err = errorDetail?.error || errorDetail as any;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">Error Detail</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { window.open(`/errors/${errorId}`, '_blank'); }}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : !err ? (
            <p className="text-sm text-gray-500 text-center py-12">Error not found</p>
          ) : (
            <>
              {/* Title + Severity */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${err.severity === 'critical' || err.severity === 'error' ? 'bg-red-500' : err.severity === 'warning' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.debug}`}>{err.severity}</span>
                  <span className="text-xs text-gray-500">{err.error_type}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-2 break-words">{displayMessage(err.message)}</p>
                <p className="text-xs text-gray-500 mt-1">{format(new Date(err.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
              </div>

              {/* ID */}
              <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Error ID</span>
                <CopyableId id={err.id} label="Error ID" />
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg border border-gray-100">
                <DetailRow label="Status">
                  <span className={err.resolved_at ? 'text-emerald-600' : err.acknowledged_at ? 'text-blue-600' : 'text-amber-600'}>
                    {err.resolved_at ? 'Resolved' : err.acknowledged_at ? 'Acknowledged' : 'Unresolved'}
                  </span>
                </DetailRow>
                {err.endpoint && (
                  <DetailRow label="Endpoint">
                    <span className="font-mono text-xs">{err.http_method} {err.endpoint}</span>
                  </DetailRow>
                )}
                {err.status_code && <DetailRow label="Status code">{err.status_code}</DetailRow>}
                {err.user_id && (
                  <DetailRow label="User">
                    <button
                      onClick={() => window.open(`/users/${err.user_id}`, '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium font-mono"
                    >
                      {err.user_id.slice(0, 12)}...
                    </button>
                  </DetailRow>
                )}
              </div>

              {/* Stack trace */}
              {err.stack_trace && (
                <div>
                  <div className="mb-1.5"><span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Stack Trace</span></div>
                  <pre className="text-[11px] bg-gray-900 text-gray-300 rounded-lg p-3 overflow-x-auto max-h-60 whitespace-pre-wrap font-mono leading-relaxed">{err.stack_trace}</pre>
                </div>
              )}

              {/* Metadata */}
              {err.metadata && Object.keys(err.metadata).length > 0 && (
                <div>
                  <div className="mb-1.5"><span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Metadata</span></div>
                  <pre className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">{JSON.stringify(err.metadata, null, 2)}</pre>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button onClick={() => errorAction.mutate('acknowledge')} disabled={errorAction.isPending}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <Eye className="w-4 h-4" /> Acknowledge
                </button>
                <button onClick={() => errorAction.mutate('resolve')} disabled={errorAction.isPending}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Mark Resolved
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function ErrorsPage() {
  useAdminPageViewLogger('errors', 'Error Logs');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);

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

  const handleCloseSlideOver = useCallback(() => setSelectedErrorId(null), []);

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
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-20">ID</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-20">Severity</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Message</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-28">Type</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-40">Endpoint</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-3 pr-8 py-3 w-28">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err: ErrorLogEntry, idx: number) => {
                      const rowNum = ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 50) + idx + 1;
                      return (
                        <tr key={err.id} onClick={() => setSelectedErrorId(err.id)} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors">
                          <td className="pl-8 pr-3 py-3 text-xs text-gray-400 tabular-nums">{rowNum}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 font-mono">{err.id.slice(0, 8)}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.debug}`}>{err.severity}</span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 max-w-[400px] truncate">{displayMessage(err.message)}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{err.error_type}</td>
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

      {/* ─── Error slide-over panel ──────────────────────── */}
      {selectedErrorId && <ErrorSlideOver errorId={selectedErrorId} onClose={handleCloseSlideOver} />}
    </div>
  );
}
