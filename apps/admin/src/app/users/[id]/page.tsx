'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { useChangeUserRole, useSuspendUser, type UserProfile } from '@/hooks';
import { useAdminPackages, type PaymentPackage } from '@/hooks';
import {
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

async function fetchUserDetail(userId: string): Promise<UserProfile | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  return data.data?.user ?? null;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-gray-200 text-right">{children}</span>
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
    if (!confirm('Suspend this user?')) return;
    await suspendUser.mutateAsync(userId);
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">User not found</p>
        <button
          onClick={() => router.push('/users')}
          className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <button
        onClick={() => router.push('/users')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Users
      </button>

      {/* Identity */}
      <div>
        <h1 className="text-lg font-semibold text-white">
          {user.full_name || 'Unnamed User'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">{user.email}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Left: Profile info */}
        <div className="space-y-8">
          {/* Profile */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Profile</h2>
            <div>
              <InfoRow label="User ID">
                <span className="font-mono text-[12px] text-gray-500">{user.user_id}</span>
              </InfoRow>
              <InfoRow label="Name">{user.full_name || '—'}</InfoRow>
              <InfoRow label="Email">
                <span className="flex items-center gap-1.5">
                  {user.email}
                  {user.email_confirmed_at ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </span>
              </InfoRow>
              <InfoRow label="Phone">{user.phone_number || '—'}</InfoRow>
              <InfoRow label="Role">
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-1 text-[13px] text-gray-200 hover:text-white transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    {user.role.replace(/_/g, ' ')}
                  </button>
                  {showRoleMenu && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a28] border border-white/[0.08] rounded-md py-1 min-w-[120px]">
                      {['user', 'admin', 'super_admin'].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleChangeRole(r)}
                          className={`block w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                            r === user.role
                              ? 'text-white bg-white/[0.05]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          {r.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </InfoRow>
              <InfoRow label="Notifications">
                {user.email_notifications ? 'Enabled' : 'Disabled'}
              </InfoRow>
            </div>
          </section>

          <div className="border-t border-white/[0.06]" />

          {/* Subscription */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Subscription</h2>
            <div>
              <InfoRow label="Package">
                <div className="relative">
                  <button
                    onClick={() => setShowPackageMenu(!showPackageMenu)}
                    className="flex items-center gap-1 text-[13px] text-gray-200 hover:text-white transition-colors"
                  >
                    <Package className="w-3 h-3" />
                    {user.package?.name || 'No package'}
                  </button>
                  {showPackageMenu && packages && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a28] border border-white/[0.08] rounded-md py-1 min-w-[160px]">
                      {packages.map((pkg: PaymentPackage) => (
                        <button
                          key={pkg.id}
                          onClick={() => handleChangePackage(pkg)}
                          className={`block w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                            pkg.id === user.package_id
                              ? 'text-white bg-white/[0.05]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          {pkg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
              {user.package?.quota_limits && (
                <>
                  <InfoRow label="Concurrent jobs">
                    {user.package.quota_limits.concurrent_jobs ?? '—'}
                  </InfoRow>
                  <InfoRow label="Keywords limit">
                    {user.package.quota_limits.keywords_limit ?? '—'}
                  </InfoRow>
                </>
              )}
              <InfoRow label="Daily quota used">
                {user.daily_quota_used ?? 0}
              </InfoRow>
            </div>
          </section>

          <div className="border-t border-white/[0.06]" />

          {/* Dates */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Timeline</h2>
            <div>
              <InfoRow label="Joined">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-gray-600" />
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </span>
              </InfoRow>
              <InfoRow label="Last sign in">
                {user.last_sign_in_at
                  ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                  : 'Never'}
              </InfoRow>
              <InfoRow label="Updated">
                {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}
              </InfoRow>
            </div>
          </section>
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/users/${userId}/activity`}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-gray-300 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                View activity log
              </Link>
              <button
                onClick={handleSuspend}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400/80 border border-red-400/10 rounded-md hover:bg-red-400/[0.06] hover:text-red-400 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Suspend user
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
