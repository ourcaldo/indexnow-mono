'use client';

import { Shield, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Activity, Wifi } from 'lucide-react';
import { formatDate } from '@indexnow/shared';
import type { SecurityData } from './index';

interface UserSecurityCardProps {
  securityData: SecurityData | null;
  securityLoading: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function riskBadge(level: string): string {
  if (level === 'low') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  if (level === 'medium') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  return 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800';
}

export function UserSecurityCard({ securityData, securityLoading }: UserSecurityCardProps) {
  if (securityLoading) {
    return (
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-10 bg-gray-100 dark:bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!securityData) {
    return (
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Security</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No security data available.</p>
      </div>
    );
  }

  const { loginAttempts, ipAddresses, locations, activity, securityScore, riskLevel } = securityData;
  const recentLogins = loginAttempts.recent.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">

      {/* Header row with score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Security Overview</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold tabular-nums ${scoreColor(securityScore)}`}>
            {securityScore}
          </span>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${riskBadge(riskLevel)}`}>
            {riskLevel} risk
          </span>
        </div>
      </div>

      {/* Three stat columns */}
      <div className="grid grid-cols-3 gap-6 py-4 border-t border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total logins</p>
          <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{loginAttempts.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Successful</p>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{loginAttempts.successful}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Failed</p>
          <p className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">{loginAttempts.failed}</p>
        </div>
      </div>

      {/* Two-column: IPs + activity meta */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Known IPs */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            Known IP addresses
          </p>
          {ipAddresses.length > 0 ? (
            <div className="space-y-1.5">
              {ipAddresses.slice(0, 4).map((ip) => (
                <div key={ip.ip} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-900 dark:text-white text-xs">{ip.ip}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{ip.usageCount}x</span>
                </div>
              ))}
              {ipAddresses.length > 4 && (
                <p className="text-xs text-gray-400">+{ipAddresses.length - 4} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No IPs recorded</p>
          )}
        </div>

        {/* Locations + activity meta */}
        <div className="space-y-4">
          {locations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Locations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {locations.slice(0, 4).map((loc) => (
                  <span key={loc} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Activity
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total events</span>
                <span className="text-gray-900 dark:text-white tabular-nums">{activity.totalActivities}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last active</span>
                <span className="text-gray-900 dark:text-white">
                  {activity.lastActivity ? formatDate(activity.lastActivity, true) : 'Never'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">First seen</span>
                <span className="text-gray-900 dark:text-white">
                  {activity.firstSeen ? formatDate(activity.firstSeen, true) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent login attempts */}
      {recentLogins.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recent login attempts
          </p>
          <div className="space-y-2">
            {recentLogins.map((attempt, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {attempt.success
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                <span className={attempt.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                  {attempt.success ? 'Success' : 'Failed'}
                </span>
                {attempt.ip_address && (
                  <span className="font-mono text-xs text-gray-400">{attempt.ip_address}</span>
                )}
                <span className="ml-auto text-xs text-gray-400 tabular-nums whitespace-nowrap">
                  {formatDate(attempt.timestamp, true)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}