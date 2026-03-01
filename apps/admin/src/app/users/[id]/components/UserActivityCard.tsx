'use client';

import {
  Activity, Monitor, Smartphone, Tablet,
  LogIn, LogOut, User, Settings, Shield, Server,
} from 'lucide-react';
import { formatDate } from '@indexnow/shared';
import { ActivityLog } from './index';

interface UserActivityCardProps {
  activityLogs: ActivityLog[];
  activityLoading: boolean;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  login: LogIn, logout: LogOut, register: User,
  profile_update: User, admin_login: Shield,
  user_management: Settings, api_call: Server, settings_change: Settings,
};

function getDeviceInfo(userAgent?: string | null): { icon: React.ElementType; text: string } {
  if (!userAgent) return { icon: Monitor, text: 'Desktop' };
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('iphone')) return { icon: Smartphone, text: 'Mobile' };
  if (ua.includes('tablet') || ua.includes('ipad')) return { icon: Tablet, text: 'Tablet' };
  return { icon: Monitor, text: 'Desktop' };
}

export function UserActivityCard({ activityLogs, activityLoading }: UserActivityCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <Activity className="w-4 h-4 text-gray-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">User actions and system events</p>
        </div>
      </div>

      {activityLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>
      ) : activityLogs.length > 0 ? (
        <div className="space-y-2">
          {activityLogs.map((log) => {
            const EventIcon = EVENT_ICONS[log.event_type] || Activity;
            const deviceInfo = getDeviceInfo(log.user_agent);
            const DeviceIcon = deviceInfo.icon;
            return (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-[#0f0f17] border border-gray-200 dark:border-gray-700">
                  <EventIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {log.action_description}
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {log.event_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    {log.ip_address && (
                      <span className="text-xs text-gray-400 font-mono">{log.ip_address}</span>
                    )}
                    {log.user_agent && (
                      <div className="flex items-center gap-1">
                        <DeviceIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{deviceInfo.text}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(log.created_at, true)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity for this user.</p>
        </div>
      )}
    </div>
  );
}
