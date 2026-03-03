'use client';

import { Package, Calendar, CheckCircle, AlertTriangle, Shield, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { UserProfile } from '@/hooks';

/* ─── Primitives ─────────────────────────────────────────── */

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-bold text-white leading-none">{initials}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = role.replace(/_/g, ' ');
  const styles: Record<string, string> = {
    super_admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    admin: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    user: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${styles[role] || styles.user}`}
    >
      <Shield className="w-3 h-3" />
      {label}
    </span>
  );
}

function StatusPill({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${verified ? 'text-emerald-600' : 'text-amber-600'}`}
    >
      {verified ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5" />
      )}
      {verified ? 'Verified' : 'Unverified'}
    </span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="px-4 py-0.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  );
}

/* ─── Quota / Usage Bar ──────────────────────────────────── */

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isHigh = pct >= 80;
  const isFull = pct >= 100;

  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-700 tabular-nums">
          {used.toLocaleString()}
          <span className="text-gray-400 font-normal">
            {' / '}
            {isUnlimited ? '∞' : limit.toLocaleString()}
          </span>
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isFull
                ? 'bg-red-500'
                : isHigh
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Latest Activity ────────────────────────────────────── */

export type ActivityLog = {
  id: string;
  event_type?: string;
  action?: string;
  action_description?: string;
  created_at: string;
};

export function LatestActivity({
  logs,
  viewAllHref,
}: {
  logs: ActivityLog[];
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Latest Activity</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View all &rarr;
          </Link>
        )}
      </div>
      {logs.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Clock className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
          <p className="text-xs text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div className="px-5 py-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700 truncate">
                  {log.event_type || log.action}
                </span>
                <span className="text-[11px] text-gray-400 whitespace-nowrap tabular-nums">
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
              {log.action_description && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {log.action_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Exported Shared Components ─────────────────────────── */

export { Avatar, RoleBadge, StatusPill, InfoCard, InfoRow };

/* ─── Main Detail Content ────────────────────────────────── */

export interface UserDetailContentProps {
  user: UserProfile;
  /** Compact mode for slide-over; full mode for detail page */
  variant?: 'compact' | 'full';
  /** Recent activity logs to display */
  recentLogs?: ActivityLog[];
}

export function UserDetailContent({
  user,
  variant = 'compact',
  recentLogs = [],
}: UserDetailContentProps) {
  const isCompact = variant === 'compact';
  const quotaLimits = user.package?.quota_limits;
  const usage = user.usage;

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="flex items-center gap-3">
        <Avatar name={user.full_name || ''} size={isCompact ? 'sm' : 'lg'} />
        <div className="min-w-0 flex-1">
          <div
            className={`font-semibold text-gray-900 ${isCompact ? 'text-base' : 'text-lg'}`}
          >
            {user.full_name || 'Unnamed User'}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
          {!isCompact && (
            <div className="flex items-center gap-3 mt-2">
              <RoleBadge role={user.role} />
              <StatusPill verified={!!user.email_confirmed_at || !!user.email_verified} />
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <InfoCard title="Account">
        <InfoRow label="Role">
          <RoleBadge role={user.role} />
        </InfoRow>
        <InfoRow label="Status">
          <StatusPill verified={!!user.email_confirmed_at || !!user.email_verified} />
        </InfoRow>
        <InfoRow label="Package">
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            {user.package?.name || 'No package'}
          </span>
        </InfoRow>
        <InfoRow label="Joined">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {format(new Date(user.created_at), 'MMM d, yyyy')}
          </span>
        </InfoRow>
        {user.last_sign_in_at && (
          <InfoRow label="Last sign in">
            {formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}
          </InfoRow>
        )}
        {!isCompact && user.phone_number && (
          <InfoRow label="Phone">{user.phone_number}</InfoRow>
        )}
        {!isCompact && (
          <InfoRow label="Notifications">
            {user.email_notifications ? 'Enabled' : 'Disabled'}
          </InfoRow>
        )}
      </InfoCard>

      {/* Subscription + Usage */}
      <InfoCard title="Subscription & Usage">
        <InfoRow label="Package">
          {user.package?.name || 'No package'}
        </InfoRow>
        {user.subscribed_at && (
          <InfoRow label="Subscribed">
            {format(new Date(user.subscribed_at), 'MMM d, yyyy')}
          </InfoRow>
        )}
        {user.expires_at && (
          <InfoRow label="Expires">
            {format(new Date(user.expires_at), 'MMM d, yyyy')}
          </InfoRow>
        )}

        {/* Usage bars */}
        {quotaLimits && usage ? (
          <>
            <UsageBar
              label="Keywords"
              used={usage.keywords_used}
              limit={quotaLimits.max_keywords ?? 0}
            />
            <UsageBar
              label="Domains"
              used={usage.domains_used}
              limit={quotaLimits.max_domains ?? 0}
            />
          </>
        ) : quotaLimits ? (
          <>
            <InfoRow label="Max keywords">
              {quotaLimits.max_keywords === -1
                ? 'Unlimited'
                : (quotaLimits.max_keywords ?? '\u2014')}
            </InfoRow>
            <InfoRow label="Max domains">
              {quotaLimits.max_domains === -1
                ? 'Unlimited'
                : (quotaLimits.max_domains ?? '\u2014')}
            </InfoRow>
          </>
        ) : (
          <InfoRow label="Quota">No quota data</InfoRow>
        )}
      </InfoCard>

      {/* Timeline (full mode only) */}
      {!isCompact && (
        <InfoCard title="Timeline">
          <InfoRow label="Joined">
            {format(new Date(user.created_at), 'MMM d, yyyy')}
          </InfoRow>
          <InfoRow label="Last sign in">
            {user.last_sign_in_at
              ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
              : 'Never'}
          </InfoRow>
          <InfoRow label="Updated">
            {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}
          </InfoRow>
        </InfoCard>
      )}

      {/* Recent Activity – compact only; full uses <LatestActivity> in its sidebar */}
      {isCompact && <LatestActivity logs={recentLogs} />}
    </div>
  );
}
