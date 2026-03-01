'use client';

import { CalendarDays } from 'lucide-react';
import {
  formatRelativeTime,
  type AdminTransactionHistory,
  type AdminOrderActivityLog,
  type Json,
} from '@indexnow/shared';

interface OrderActivityTimelineProps {
  transactionHistory: AdminTransactionHistory[] | undefined;
  activityHistory: AdminOrderActivityLog[] | undefined;
}

interface UnifiedActivity {
  id: string;
  type: 'transaction' | 'activity';
  event_type: string;
  action_description: string;
  created_at: string;
  user: { full_name: string; role?: string | null };
  metadata: Record<string, Json>;
}

function mergeAndSort(
  tx: AdminTransactionHistory[] | undefined,
  act: AdminOrderActivityLog[] | undefined
): UnifiedActivity[] {
  const txItems: UnifiedActivity[] = (tx || []).map((th) => ({
    id: th.id,
    type: 'transaction',
    event_type: th.action_type,
    action_description: th.action_description,
    created_at: th.created_at,
    user: th.user || { full_name: th.changed_by_type === 'admin' ? 'Admin' : 'System', role: th.changed_by_type },
    metadata: { old_status: th.old_status, new_status: th.new_status, notes: th.notes, ...((th.metadata as Record<string, Json>) || {}) },
  }));
  const actItems: UnifiedActivity[] = (act || []).map((ah) => ({
    id: ah.id,
    type: 'activity',
    event_type: ah.action_type,
    action_description: ah.action_description,
    created_at: ah.created_at,
    user: ah.user || { full_name: 'System', role: 'system' },
    metadata: (ah.metadata as Record<string, Json>) || {},
  }));
  return [...txItems, ...actItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function OrderActivityTimeline({ transactionHistory, activityHistory }: OrderActivityTimelineProps) {
  const all = mergeAndSort(transactionHistory, activityHistory);
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Activity</h3>
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-4 max-h-80 overflow-y-auto">
        {all.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {all.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{a.action_description}</p>
                  {a.type === 'transaction' && a.metadata?.old_status && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {a.metadata.old_status as string} → {a.metadata.new_status as string}
                    </p>
                  )}
                  {a.metadata?.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">
                      &ldquo;{a.metadata.notes as string}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <CalendarDays className="w-3 h-3" />
                    <span>{formatRelativeTime(a.created_at)}</span>
                    {a.user?.full_name && <><span>·</span><span>{a.user.full_name}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
