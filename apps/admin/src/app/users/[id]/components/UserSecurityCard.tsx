'use client';

import { Shield, MapPin, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@indexnow/shared';
import type { SecurityData } from '.';

interface UserSecurityCardProps {
  securityData: SecurityData | null;
  securityLoading: boolean;
}

function getRiskBadge(riskLevel: string): string {
  if (riskLevel === 'low')    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800';
  if (riskLevel === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800';
  if (riskLevel === 'high')   return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-800';
  return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
}

function getScoreText(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function UserSecurityCard({ securityData, securityLoading }: UserSecurityCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <Shield className="w-4 h-4 text-gray-400" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Security Overview</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Account security metrics and login patterns</p>
        </div>
      </div>

      {securityLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : securityData ? (
        <div className="space-y-6">
          {/* Score + Risk */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Security Score</p>
              <p className={`text-2xl font-bold ${getScoreText(securityData.securityScore)}`}>
                {securityData.securityScore}<span className="text-sm font-normal text-gray-400">/100</span>
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Risk Level</p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border ${getRiskBadge(securityData.riskLevel)}`}>
                <AlertTriangle className="w-3 h-3" />
                {securityData.riskLevel.charAt(0).toUpperCase() + securityData.riskLevel.slice(1)}
              </span>
            </div>
          </div>

          {/* Login Attempts */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Login Attempts</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{securityData.loginAttempts.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{securityData.loginAttempts.successful}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Successful</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{securityData.loginAttempts.failed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Failed</p>
              </div>
            </div>
          </div>

          {/* IP Addresses */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">IP Addresses</h4>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {securityData.ipAddresses.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/30 rounded px-3 py-2">
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{ip.ip}</span>
                  <span className="text-xs text-gray-400">
                    {ip.usageCount}x · Last: {formatDate(ip.lastUsed)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          {securityData.locations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Locations</h4>
              <div className="flex flex-wrap gap-1.5">
                {securityData.locations.map((location, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {location}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Login Attempts */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Login Attempts</h4>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {securityData.loginAttempts.recent.map((attempt, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/30 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    {attempt.success
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    <span className="text-sm text-gray-900 dark:text-white">
                      {attempt.success ? 'Successful login' : 'Failed login'}
                    </span>
                    {attempt.ip_address && (
                      <span className="text-xs text-gray-400 font-mono">from {attempt.ip_address}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(attempt.timestamp, true)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Activity</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {securityData.activity.lastActivity ? formatDate(securityData.activity.lastActivity) : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">First Seen</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {securityData.activity.firstSeen ? formatDate(securityData.activity.firstSeen) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Activities</p>
                <p className="text-sm text-gray-900 dark:text-white">{securityData.activity.totalActivities}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <Shield className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Security information is not available for this user.</p>
        </div>
      )}
    </div>
  );
}
