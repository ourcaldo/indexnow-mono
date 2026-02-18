'use client';

import { Shield, MapPin, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { type Json, formatDate } from '@indexnow/shared';
import type { SecurityData } from '.';

interface UserSecurityCardProps {
  securityData: SecurityData | null;
  securityLoading: boolean;
}

export function UserSecurityCard({ securityData, securityLoading }: UserSecurityCardProps) {
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="border-border rounded-lg border bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-destructive/10 rounded-lg p-2">
          <Shield className="text-destructive h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground text-lg font-bold">Security Overview</h3>
          <p className="text-muted-foreground text-sm">
            Account security metrics and login patterns
          </p>
        </div>
      </div>

      {securityLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary flex items-center space-x-3 rounded-lg p-3">
                <div className="bg-muted h-8 w-8 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-2/3 rounded"></div>
                  <div className="bg-muted h-3 w-1/3 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : securityData ? (
        <div className="space-y-6">
          {/* Security Score & Risk Level */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Security Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getSecurityScoreColor(securityData.securityScore)}`}
                  >
                    {securityData.securityScore}/100
                  </p>
                </div>
                <div className="border-border flex h-12 w-12 items-center justify-center rounded-full border-4">
                  <span
                    className={`text-lg font-bold ${getSecurityScoreColor(securityData.securityScore)}`}
                  >
                    {securityData.securityScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Risk Level
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getRiskLevelColor(securityData.riskLevel)}`}
                  >
                    {securityData.riskLevel.toUpperCase()}
                  </span>
                </div>
                <AlertTriangle
                  className={`h-8 w-8 ${
                    securityData.riskLevel === 'high'
                      ? 'text-destructive'
                      : securityData.riskLevel === 'medium'
                        ? 'text-warning'
                        : 'text-success'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Login Attempts */}
          <div>
            <h4 className="text-foreground mb-3 font-medium">Login Attempts</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-foreground text-2xl font-bold">
                  {securityData.loginAttempts.total}
                </p>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Total</p>
              </div>
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-success text-2xl font-bold">
                  {securityData.loginAttempts.successful}
                </p>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Successful</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-destructive text-2xl font-bold">
                  {securityData.loginAttempts.failed}
                </p>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Failed</p>
              </div>
            </div>
          </div>

          {/* IP Addresses */}
          <div>
            <h4 className="text-foreground mb-3 font-medium">IP Addresses</h4>
            <div className="max-h-32 space-y-2 overflow-y-auto">
              {securityData.ipAddresses.map((ip, index) => (
                <div
                  key={index}
                  className="bg-secondary flex items-center justify-between rounded p-2"
                >
                  <span className="text-foreground font-mono text-sm">{ip.ip}</span>
                  <div className="text-muted-foreground text-xs">
                    Used {ip.usageCount} times • Last: {formatDate(ip.lastUsed)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-foreground mb-3 font-medium">Locations</h4>
            <div className="flex flex-wrap gap-2">
              {securityData.locations.map((location, index) => (
                <div
                  key={index}
                  className="bg-accent/10 text-accent flex items-center space-x-1 rounded-full px-2 py-1 text-xs"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Login Attempts */}
          <div>
            <h4 className="text-foreground mb-3 font-medium">Recent Login Attempts</h4>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {securityData.loginAttempts.recent.map((attempt, index) => (
                <div
                  key={index}
                  className="bg-secondary flex items-center justify-between rounded p-2"
                >
                  <div className="flex items-center space-x-2">
                    {attempt.success ? (
                      <CheckCircle className="text-success h-4 w-4" />
                    ) : (
                      <XCircle className="text-destructive h-4 w-4" />
                    )}
                    <span className="text-foreground text-sm">
                      {attempt.success ? 'Successful login' : 'Failed login'}
                    </span>
                    {attempt.ip_address && (
                      <span className="text-muted-foreground font-mono text-xs">
                        from {attempt.ip_address}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(attempt.timestamp, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <Clock className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Last Activity
                </p>
                <p className="text-foreground text-sm">
                  {securityData.activity.lastActivity
                    ? formatDate(securityData.activity.lastActivity)
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">First Seen</p>
                <p className="text-foreground text-sm">
                  {securityData.activity.firstSeen
                    ? formatDate(securityData.activity.firstSeen)
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Total Activities
                </p>
                <p className="text-foreground text-sm">{securityData.activity.totalActivities}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <Shield className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h4 className="text-foreground mb-2 text-lg font-medium">No Security Data</h4>
          <p className="text-muted-foreground text-sm">
            Security information is not available for this user.
          </p>
        </div>
      )}
    </div>
  );
}
