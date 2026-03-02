'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { useChangeUserRole, useSuspendUser, useAdminUserActivity, type UserProfile } from '@/hooks';
import { useAdminPackages, type PaymentPackage } from '@/hooks';
import {
  ArrowLeft, Shield, Calendar, Package, AlertTriangle,
  CheckCircle, Activity, X, Ban, Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

async function fetchUserDetail(userId: string): Promise<UserProfile | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  return data.data?.user ?? null;
}

/* ─── Shared components ──────────────────────────────────── */

function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  // Modal states
  const [roleModal, setRoleModal] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });

  const { data: packages } = useAdminPackages();
  const changeRole = useChangeUserRole();
  const suspendUser = useSuspendUser();
  const { data: activityData } = useAdminUserActivity(userId, 1);
  const recentLogs = (activityData?.logs ?? []).slice(0, 5);

  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    await changeRole.mutateAsync({ userId, newRole: selectedRole });
    invalidateUser();
    setRoleModal(false);
  };

  const handleConfirmPackage = async () => {
    const pkg = packages?.find((p: PaymentPackage) => p.id === selectedPackageId);
    if (!pkg) return;
    await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: pkg.id }),
    });
    invalidateUser();
    setPackageModal(false);
  };

  const handleConfirmSuspend = async () => {
    await suspendUser.mutateAsync(userId);
    invalidateUser();
    setSuspendModal(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">User not found</p>
        <button onClick={() => router.push('/users')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Back to users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/users')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Users
      </button>

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <Avatar name={user.full_name || ''} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{user.full_name || 'Unnamed User'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ${
                user.role === 'super_admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                user.role === 'admin' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                'bg-gray-50 text-gray-600 ring-gray-500/20'
              }`}>
                <Shield className="w-3 h-3" />
                {user.role.replace(/_/g, ' ')}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.email_confirmed_at ? 'text-emerald-600' : 'text-amber-600'}`}>
                {user.email_confirmed_at ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {user.email_confirmed_at ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Left column – info cards */}
        <div className="space-y-4">
          <InfoCard title="Profile">
            <InfoRow label="User ID">{user.user_id}</InfoRow>
            <InfoRow label="Full name">{user.full_name || '\u2014'}</InfoRow>
            <InfoRow label="Email">
              <span className="flex items-center gap-1.5">{user.email} {user.email_confirmed_at && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}</span>
            </InfoRow>
            <InfoRow label="Phone">{user.phone_number || '\u2014'}</InfoRow>
            <InfoRow label="Role">{user.role.replace(/_/g, ' ')}</InfoRow>
            <InfoRow label="Notifications">{user.email_notifications ? 'Enabled' : 'Disabled'}</InfoRow>
          </InfoCard>

          <InfoCard title="Subscription">
            <InfoRow label="Package">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                {user.package?.name || 'No package'}
              </span>
            </InfoRow>
            {user.subscribed_at && <InfoRow label="Subscribed">{format(new Date(user.subscribed_at), 'MMM d, yyyy')}</InfoRow>}
            {user.expires_at && <InfoRow label="Expires">{format(new Date(user.expires_at), 'MMM d, yyyy')}</InfoRow>}
            {user.package?.quota_limits && (
              <>
                <InfoRow label="Concurrent jobs">{user.package.quota_limits.concurrent_jobs ?? '\u2014'}</InfoRow>
                <InfoRow label="Keywords limit">{user.package.quota_limits.keywords_limit ?? '\u2014'}</InfoRow>
              </>
            )}
          </InfoCard>

          <InfoCard title="Timeline">
            <InfoRow label="Joined">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
            </InfoRow>
            <InfoRow label="Last sign in">{user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Never'}</InfoRow>
            <InfoRow label="Updated">{formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}</InfoRow>
          </InfoCard>
        </div>

        {/* Right column – actions & activity */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/users/${userId}/activity`} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Activity className="w-4 h-4 text-gray-500" />
                View activity log
              </Link>
              <button
                onClick={() => { setSelectedRole(user.role); setRoleModal(true); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-4 h-4 text-gray-500" />
                Change role
              </button>
              <button
                onClick={() => { setSelectedPackageId(user.package_id ?? ''); setPackageModal(true); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Package className="w-4 h-4 text-gray-500" />
                Change package
              </button>
              <button
                onClick={() => setSuspendModal(true)}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Suspend user
              </button>
            </div>
          </div>

          {/* Latest activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Latest Activity</h3>
              <Link href={`/users/${userId}/activity`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all &rarr;
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Clock className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400">No activity yet</p>
              </div>
            ) : (
              <div className="px-5 py-2">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5 border-b border-gray-50 last:border-0">
                    <div className="text-sm text-gray-900">{log.event_type}</div>
                    {log.action_description && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{log.action_description}</div>
                    )}
                    <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Change Role Modal ────────────────────────────── */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Change Role">
        <p className="text-sm text-gray-500 mb-4">
          Select the new role for <span className="font-medium text-gray-900">{user.full_name || user.email}</span>.
        </p>
        <div className="space-y-2 mb-5">
          {['user', 'admin', 'super_admin'].map((role) => (
            <label key={role} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              selectedRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input type="radio" name="role" value={role} checked={selectedRole === role} onChange={() => setSelectedRole(role)}
                className="text-blue-600 focus:ring-blue-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">{role.replace(/_/g, ' ')}</span>
                {role === user.role && <span className="text-xs text-gray-400 ml-2">(current)</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setRoleModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmRole} disabled={changeRole.isPending || selectedRole === user.role}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
            {changeRole.isPending ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </Modal>

      {/* ─── Change Package Modal ─────────────────────────── */}
      <Modal open={packageModal} onClose={() => setPackageModal(false)} title="Change Package">
        <p className="text-sm text-gray-500 mb-4">
          Select the new package for <span className="font-medium text-gray-900">{user.full_name || user.email}</span>.
        </p>
        <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
          {(packages ?? []).map((pkg: PaymentPackage) => (
            <label key={pkg.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              selectedPackageId === pkg.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input type="radio" name="package" value={pkg.id} checked={selectedPackageId === pkg.id} onChange={() => setSelectedPackageId(pkg.id)}
                className="text-blue-600 focus:ring-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{pkg.name}
                  {pkg.id === user.package_id && <span className="text-xs text-gray-400 ml-2">(current)</span>}
                </div>
                <div className="text-xs text-gray-500">{pkg.currency} {pkg.price}/{pkg.billing_period}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPackageModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmPackage} disabled={selectedPackageId === user.package_id}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
            Confirm
          </button>
        </div>
      </Modal>

      {/* ─── Suspend Modal ────────────────────────────────── */}
      <Modal open={suspendModal} onClose={() => setSuspendModal(false)} title="Suspend User">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Ban className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-900 font-medium">Are you sure you want to suspend this user?</p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">{user.full_name || user.email}</span> will lose access to their account. This action cannot be easily undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setSuspendModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmSuspend} disabled={suspendUser.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors">
            {suspendUser.isPending ? 'Suspending...' : 'Suspend'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
