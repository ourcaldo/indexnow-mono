'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUserActivity } from '@/hooks';
import { format } from 'date-fns';

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUserActivity(userId, page);
  const logs = data?.logs ?? [];
  const user = data?.user;
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/users/${userId}`)}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {user?.name || 'User'}
      </button>

      <div>
        <h1 className="text-lg font-semibold text-white">Activity Log</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {user?.name || 'User'} &middot; {data?.pagination?.total ?? 0} events
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-600">No activity recorded</p>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_200px_140px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>Event</span>
            <span>Details</span>
            <span>Time</span>
          </div>
          <div className="border-t border-white/[0.04]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_200px_140px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 text-[13px]"
              >
                <div>
                  <span className="text-gray-200">{log.event_type}</span>
                  {log.target_type && (
                    <span className="text-gray-600 ml-1.5">{log.target_type}</span>
                  )}
                </div>
                <div className="text-gray-500 truncate">
                  {log.action_description || '—'}
                </div>
                <div className="text-gray-600 tabular-nums">
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                </div>
              </div>
            ))}
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
