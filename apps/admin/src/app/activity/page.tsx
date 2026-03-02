'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ChevronLeft, ChevronRight, X, ExternalLink, CheckCircle, XCircle, Copy, Check, SquareArrowOutUpRight } from 'lucide-react';
import { useAdminActivity, useAdminActivityDetail } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

const DAYS_OPTIONS = [
  { label: '24h', value: '1' },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

const ENTITY_LABELS: Record<string, { label: string; color: string }> = {
  user:            { label: 'User',            color: 'bg-blue-50 text-blue-700' },
  session:         { label: 'Session',         color: 'bg-green-50 text-green-700' },
  order:           { label: 'Order',           color: 'bg-amber-50 text-amber-700' },
  payment_gateway: { label: 'Payment GW',      color: 'bg-purple-50 text-purple-700' },
  settings:        { label: 'Settings',        color: 'bg-gray-100 text-gray-700' },
  package:         { label: 'Package',         color: 'bg-indigo-50 text-indigo-700' },
  domain:          { label: 'Domain',          color: 'bg-teal-50 text-teal-700' },
  keyword:         { label: 'Keyword',         color: 'bg-pink-50 text-pink-700' },
  subscription:    { label: 'Subscription',    color: 'bg-orange-50 text-orange-700' },
  billing:         { label: 'Billing',         color: 'bg-yellow-50 text-yellow-700' },
  security:        { label: 'Security',        color: 'bg-red-50 text-red-700' },
  page:            { label: 'Page View',       color: 'bg-slate-50 text-slate-600' },
  dashboard:       { label: 'Dashboard',       color: 'bg-sky-50 text-sky-700' },
  job:             { label: 'Job',             color: 'bg-violet-50 text-violet-700' },
  user_action:     { label: 'User Action',     color: 'bg-cyan-50 text-cyan-700' },
  admin_page:      { label: 'Admin Page',      color: 'bg-neutral-50 text-neutral-700' },
};

function EntityBadge({ type }: { type?: string }) {
  if (!type) return <span className="text-gray-300">&mdash;</span>;
  const cfg = ENTITY_LABELS[type] ?? { label: type.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${cfg.color}`}>{cfg.label}</span>;
}

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = useCallback((text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key ?? text);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);
  return { copiedId, copy };
}

function CopyableId({ id, label, full }: { id: string; label?: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 group text-xs text-gray-600 hover:text-gray-900 transition-colors" title={`Click to copy${label ? ` ${label}` : ''}: ${id}`}>
      <span className={full ? 'font-mono' : 'font-mono'}>{full ? id : id.slice(0, 8)}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </button>
  );
}

function IdWithOpenButton({ id, href, label }: { id: string; href: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button onClick={handleCopy} className="inline-flex items-center gap-1 group text-xs text-gray-600 hover:text-gray-900 font-mono transition-colors" title={`Click to copy ${label ?? 'ID'}`}>
        {id}
        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </button>
      <button onClick={(e) => { e.stopPropagation(); window.open(href, '_blank'); }} className="p-0.5 rounded text-gray-300 hover:text-blue-600 transition-colors" title={`Open ${label ?? 'detail'} in new tab`}>
        <SquareArrowOutUpRight className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ─── Slide-over panel ───────────────────────────────────── */

function SlideOverPanel({ logId, onClose }: { logId: string; onClose: () => void }) {
  const router = useRouter();
  const { data: activity, isLoading } = useAdminActivityDetail(logId);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">Activity Detail</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { window.open(`/activity/${logId}`, '_blank'); }}
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
          ) : !activity ? (
            <p className="text-sm text-gray-500 text-center py-12">Activity not found</p>
          ) : (
            <>
              {/* Title + Status */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-gray-900">{activity.event_type}</span>
                  {activity.success ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-50 text-red-700">
                      <XCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
              </div>

              {/* ID */}
              <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Activity ID</span>
                <CopyableId id={activity.id} label="Activity ID" full />
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg border border-gray-100">
                <DetailRow label="Event type">{activity.event_type}</DetailRow>
                {activity.action_description && <DetailRow label="Description">{activity.action_description}</DetailRow>}
                {activity.target_type && (
                  <DetailRow label="Entity"><EntityBadge type={activity.target_type} /></DetailRow>
                )}
                {activity.target_id && (
                  <DetailRow label="Target ID"><span className="font-mono text-xs text-gray-500">{activity.target_id}</span></DetailRow>
                )}
                {activity.error_message && (
                  <DetailRow label="Error"><span className="text-red-600 text-xs">{activity.error_message}</span></DetailRow>
                )}
              </div>

              {/* User */}
              {activity.user_id && (
                <div className="bg-white rounded-lg border border-gray-100">
                  <div className="px-3.5 py-2 border-b border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">User</span>
                  </div>
                  {activity.user_name && <DetailRow label="Name">{activity.user_name}</DetailRow>}
                  {activity.user_email && <DetailRow label="Email">{activity.user_email}</DetailRow>}
                  <DetailRow label="User ID">
                    <IdWithOpenButton id={activity.user_id!} href={`/users/${activity.user_id}`} label="User ID" />
                  </DetailRow>
                </div>
              )}

              {/* Technical */}
              {activity.ip_address && (
                <div className="bg-white rounded-lg border border-gray-100">
                  <div className="px-3.5 py-2 border-b border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Technical</span>
                  </div>
                  <DetailRow label="IP Address">{activity.ip_address}</DetailRow>
                  {activity.user_agent && <DetailRow label="User Agent"><span className="text-xs break-all">{activity.user_agent}</span></DetailRow>}
                </div>
              )}

              {/* Metadata */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div>
                  <div className="mb-1.5"><span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Metadata</span></div>
                  <pre className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">{JSON.stringify(activity.metadata, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-3.5 py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-900 text-right">{children}</span>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function ActivityPage() {
  useAdminPageViewLogger('activity', 'Activity Logs');
  const [days, setDays] = useState('7');
  const [page, setPage] = useState(1);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useAdminActivity({ days, page, limit: 50 });
  const logs = data?.logs ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? 0;
  const limit = data?.pagination?.limit ?? 50;
  const offset = (page - 1) * limit;

  const handleClose = useCallback(() => setSelectedLogId(null), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} events</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Day filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {DAYS_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => { setDays(opt.value); setPage(1); }}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${days === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >{opt.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 w-10">#</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">ID</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">User</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Event</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Entity</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any, idx: number) => (
                    <tr key={log.id} onClick={() => setSelectedLogId(log.id)} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-400 tabular-nums">{offset + idx + 1}</td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 tabular-nums">{log.id.slice(0, 8)}</td>
                      <td className="px-3 py-3.5">
                        <div className="text-xs font-mono text-gray-500 truncate max-w-[140px]" title={log.user_id || ''}>{log.user_id ? log.user_id.slice(0, 8) : '\u2014'}</div>
                        {log.user_name && log.user_name !== 'Unknown User' && (
                          <div className="text-[11px] text-gray-400 truncate max-w-[140px]">({log.user_name})</div>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{log.event_type}</div>
                        {log.action_description && <div className="text-xs text-gray-500 truncate max-w-[220px] mt-0.5">{log.action_description}</div>}
                      </td>
                      <td className="px-3 py-3.5"><EntityBadge type={log.target_type} /></td>
                      <td className="px-3 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">{format(new Date(log.created_at), 'MMM d, HH:mm')}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={6} className="py-16 text-center text-sm text-gray-400">No activity found</td></tr>}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-over detail panel */}
      {selectedLogId && <SlideOverPanel logId={selectedLogId} onClose={handleClose} />}
    </div>
  );
}
