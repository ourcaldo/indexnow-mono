'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Monitor, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@indexnow/shared';
import { useAdminUserActivity } from '@/hooks';

function getDeviceIcon(ua?: string | null) {
  if (!ua) return <Monitor className="w-3.5 h-3.5" />;
  const u = ua.toLowerCase();
  if (u.includes('mobile') || u.includes('android') || u.includes('iphone')) return <Smartphone className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

export default function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const userId = resolvedParams?.id ?? '';
  const { data, isLoading, error } = useAdminUserActivity(userId, currentPage);

  const logs = data?.logs ?? [];
  const user = data?.user ?? null;
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 };

  const successCount = logs.filter((l) => l.success).length;
  const failedCount = logs.filter((l) => !l.success).length;
  const eventTypes = new Set(logs.map((l) => l.event_type)).size;

  if (isLoading) return <div className="py-20 text-center text-sm text-gray-400">Loading activity…</div>;
  if (error) return (
    <div className="py-10 text-center space-y-2">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Failed to load activity</p>
      <p className="text-xs text-gray-400">{error.message}</p>
      <button onClick={() => window.location.reload()} className="text-xs underline text-gray-400">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/users" className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Activity history</h1>
            {user?.name && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.name}</p>}
          </div>
        </div>
        {userId && (
          <Link href={`/users/${userId}`} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            View user profile
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total activities', value: pagination.total },
          { label: 'Successful', value: successCount, cls: 'text-green-600 dark:text-green-400' },
          { label: 'Failed', value: failedCount, cls: 'text-red-600 dark:text-red-400' },
          { label: 'Event types', value: eventTypes },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <p className={`text-xl font-semibold tabular-nums ${s.cls || 'text-gray-900 dark:text-white'}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity table */}
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No activity found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Result</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP / Device</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{log.event_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[240px] truncate">
                    {log.action_description}
                    {log.error_message && <span className="block text-xs text-red-500">{log.error_message}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {log.success
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <span className="font-mono">{log.ip_address || '—'}</span>
                      {getDeviceIcon(log.user_agent)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/activity/${log.id}`} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} total)
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
