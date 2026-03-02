'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminActivity } from '@/hooks';
import { format } from 'date-fns';

const DAYS_OPTIONS = [
  { label: '24h', value: '1' },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

export default function ActivityPage() {
  const router = useRouter();
  const [days, setDays] = useState('7');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useAdminActivity({ days, page, limit: 50 });
  const logs = data?.logs ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? 0;

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
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Event</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Entity</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} onClick={() => router.push(`/activity/${log.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-gray-900 truncate">{log.event_type}</div>
                        {log.action_description && <div className="text-xs text-gray-500 truncate mt-0.5">{log.action_description}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 truncate">{log.user_name || log.user_email || '\u2014'}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{log.target_type || '\u2014'}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">{format(new Date(log.created_at), 'MMM d, HH:mm')}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={4} className="py-16 text-center text-sm text-gray-400">No activity found</td></tr>}
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
    </div>
  );
}
