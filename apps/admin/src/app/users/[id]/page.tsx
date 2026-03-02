'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { useChangeUserRole, useSuspendUser, type UserProfile } from '@/hooks';
import { useAdminPackages, type PaymentPackage } from '@/hooks';
import {
  ArrowLeft, Shield, Mail, Calendar, Package, AlertTriangle,
  CheckCircle, Activity, ChevronDown,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

async function fetchUserDetail(userId: string): Promise<UserProfile | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  return data.data?.user ?? null;
}

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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showPackageMenu, setShowPackageMenu] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  });

  const { data: packages } = useAdminPackages();
  const changeRole = useChangeUserRole();
  const suspendUser = useSuspendUser();

  const handleChangeRole = async (role: string) => {
    setShowRoleMenu(false);
    await changeRole.mutateAsync({ userId, newRole: role });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
  };

  const handleChangePackage = async (pkg: PaymentPackage) => {
    setShowPackageMenu(false);
    await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: pkg.id }),
    });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
  };

  const handleSuspend = async () => {
    if (!confirm('Suspend this user? This action cannot be easily undone.')) return;
    await suspendUser.mutateAsync(userId);
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
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
        <div className="space-y-4">
          <InfoCard title="Profile">
            <InfoRow label="User ID"><span className="font-mono text-xs text-gray-500">{user.user_id}</span></InfoRow>
            <InfoRow label="Full name">{user.full_name || '\u2014'}</InfoRow>
            <InfoRow label="Email">
              <span className="flex items-center gap-1.5">{user.email} {user.email_confirmed_at && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}</span>
            </InfoRow>
            <InfoRow label="Phone">{user.phone_number || '\u2014'}</InfoRow>
            <InfoRow label="Role">
              <div className="relative">
                <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-blue-600 transition-colors">
                  {user.role.replace(/_/g, ' ')} <ChevronDown className="w-3 h-3" />
                </button>
                {showRoleMenu && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
                    {['user', 'admin', 'super_admin'].map((r) => (
                      <button key={r} onClick={() => handleChangeRole(r)} className={`block w-full text-left px-3 py-2 text-sm transition-colors ${r === user.role ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {r.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </InfoRow>
            <InfoRow label="Notifications">{user.email_notifications ? 'Enabled' : 'Disabled'}</InfoRow>
          </InfoCard>

          <InfoCard title="Subscription">
            <InfoRow label="Package">
              <div className="relative">
                <button onClick={() => setShowPackageMenu(!showPackageMenu)} className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-blue-600 transition-colors">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {user.package?.name || 'No package'} <ChevronDown className="w-3 h-3" />
                </button>
                {showPackageMenu && packages && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                    {packages.map((pkg: PaymentPackage) => (
                      <button key={pkg.id} onClick={() => handleChangePackage(pkg)} className={`block w-full text-left px-3 py-2 text-sm transition-colors ${pkg.id === user.package_id ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {pkg.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </InfoRow>
            {user.subscribed_at && <InfoRow label="Subscribed">{format(new Date(user.subscribed_at), 'MMM d, yyyy')}</InfoRow>}
            {user.expires_at && <InfoRow label="Expires">{format(new Date(user.expires_at), 'MMM d, yyyy')}</InfoRow>}
            {user.package?.quota_limits && (
              <>
                <InfoRow label="Concurrent jobs">{user.package.quota_limits.concurrent_jobs ?? '\u2014'}</InfoRow>
                <InfoRow label="Keywords limit">{user.package.quota_limits.keywords_limit ?? '\u2014'}</InfoRow>
              </>
            )}
            <InfoRow label="Daily quota used">{user.daily_quota_used ?? 0}</InfoRow>
          </InfoCard>

          <InfoCard title="Timeline">
            <InfoRow label="Joined">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
            </InfoRow>
            <InfoRow label="Last sign in">{user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Never'}</InfoRow>
            <InfoRow label="Updated">{formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}</InfoRow>
          </InfoCard>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/users/${userId}/activity`} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Activity className="w-4 h-4 text-gray-500" />
                View activity log
              </Link>
              <button onClick={handleSuspend} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                Suspend user
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
