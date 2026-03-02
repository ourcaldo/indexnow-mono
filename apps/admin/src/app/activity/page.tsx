'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminActivity } from '@/hooks';
import { format } from 'date-fns';

const DAYS_OPTIONS = [
  { label: '24 hours', value: '1' },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Activity</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{total.toLocaleString()} events</p>
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

      {/* Filters */}
      <div className="flex items-center gap-2">
        {DAYS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setDays(opt.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
              days === opt.value
                ? 'bg-white/[0.07] text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_180px_120px_120px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>Event</span>
            <span>User</span>
            <span>Entity</span>
            <span>Time</span>
          </div>

          <div className="border-t border-white/[0.04]">
            {logs.map((log: any) => (
              <div
                key={log.id}
                onClick={() => router.push(`/activity/${log.id}`)}
                className="grid grid-cols-[1fr_180px_120px_120px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13px] text-gray-200 truncate">{log.event_type}</div>
                  {log.action_description && (
                    <div className="text-[12px] text-gray-600 truncate mt-0.5">
                      {log.action_description}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-[13px] text-gray-400 truncate">
                  {log.user_name || log.user_email || '—'}
                </div>
                <div className="flex items-center text-[12px] text-gray-600 truncate">
                  {log.target_type || '—'}
                </div>
                <div className="flex items-center text-[12px] text-gray-600 tabular-nums">
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-600">No activity found</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04]">
              <span className="text-[12px] text-gray-600">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
