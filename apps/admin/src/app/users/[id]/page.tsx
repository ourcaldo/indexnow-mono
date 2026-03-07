'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { useChangeUserRole, useSuspendUser, useAdminUserActivity, useAdminUserDetail, type UserProfile } from '@/hooks';
import { useAdminPackages, type PaymentPackage } from '@/hooks';
import {
  ArrowLeft, Shield, Package, AlertTriangle,
  Activity, Ban,
} from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { UserDetailContent, LatestActivity } from '@/components/UserDetailContent';

/* ─── Page ───────────────────────────────────────────────── */

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  useAdminPageViewLogger('users', 'User Detail', { userId });

  // Modal states
  const [roleModal, setRoleModal] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const { data: user, isLoading } = useAdminUserDetail(userId);

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
      <div className="bg-white min-h-full">
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white min-h-full flex flex-col items-center justify-center py-24 space-y-4">
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
    <div className="bg-white min-h-full">
      <div className="px-8 py-5 border-b border-gray-200">
        <button onClick={() => router.push('/users')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          Users
        </button>
      </div>

      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left column – shared detail content */}
        <UserDetailContent user={user} variant="full" recentLogs={recentLogs} />

        {/* Right column – actions & activity */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5">
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
          <LatestActivity logs={recentLogs} viewAllHref={`/users/${userId}/activity`} />
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
                <div className="text-xs text-gray-500">{Object.entries(pkg.pricing_tiers || {}).map(([p, t]: [string, any]) => `$${t?.regular_price ?? 0}/${p}`).join(', ') || 'Free'}</div>
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
