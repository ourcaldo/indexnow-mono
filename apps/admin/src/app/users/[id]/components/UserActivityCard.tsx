'use client';

import {
  Activity, Monitor, Smartphone, Tablet,
  LogIn, LogOut, User, Settings, Shield, Server,
} from 'lucide-react';
import { formatDate } from '@indexnow/shared';
import type { ActivityLog } from './index';

interface UserActivityCardProps {
  activityLogs: ActivityLog[];
  activityLoading: boolean;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  login: LogIn, logout: LogOut, register: User,
  profile_update: User, admin_login: Shield,
  user_management: Settings, api_call: Server, settings_change: Settings,
};

function getDeviceIcon(userAgent?: string | null): React.ElementType {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('iphone')) return Smartphone;
  if (ua.includes('tablet') || ua.includes('ipad')) return Tablet;
  return Monitor;
}

function resultDot(success: boolean) {
  return success
    ? 'bg-emerald-500'
    : 'bg-rose-500';
}

export function UserActivityCard({ activityLogs, activityLoading }: UserActivityCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg">

      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activityLogs.length > 0 ? `${activityLogs.length} events` : 'User actions and events'}
          </p>
        </div>
      </div>

      {activityLoading ? (
        <div className="p-6 space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activityLogs.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-400">No activity recorded</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
          {activityLogs.map((log) => {
            const EventIcon = EVENT_ICONS[log.event_type] || Activity;
            const DeviceIcon = getDeviceIcon(log.user_agent);
            const success = (log as any).success ?? true;
            return (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">

                {/* Icon */}
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mt-0.5">
                  <EventIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Primary: action description (prominent) */}
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">
                    {log.action_description || log.event_type.replace(/_/g, ' ')}
                  </p>
                  {/* Secondary: event type + IP + device (smaller) */}
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                    {log.ip_address && (
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{log.ip_address}</span>
                    )}
                    {log.user_agent && (
                      <DeviceIcon className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Right: success dot + time */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${resultDot(success)}`} title={success ? 'Success' : 'Failed'} />
                  <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums whitespace-nowrap">
                    {formatDate(log.created_at, true)}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}