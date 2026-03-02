'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { useAdminPageViewLogger } from '@indexnow/ui';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  MoreHorizontal, Shield, Package, Ban,
  X, ExternalLink, Calendar, CheckCircle, AlertTriangle, Activity, Clock, Copy, Check,
} from 'lucide-react';
import { useAdminUsers, useChangeUserRole, useSuspendUser, useAdminUserActivity, type UserProfile } from '@/hooks';
import { useAdminPackages, type PaymentPackage } from '@/hooks';
import { format, formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/Modal';

/* ─── Shared components ──────────────────────────────────── */

function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-bold text-white leading-none">{initials}</span>
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
    <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${styles[role] || styles.user}`}>
      {label}
    </span>
  );
}

function StatusPill({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${verified ? 'text-emerald-600' : 'text-amber-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {verified ? 'Verified' : 'Unverified'}
    </span>
  );
}

/* ─── Copyable ID ────────────────────────────────────────── */

function CopyableId({ id, full }: { id: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 group text-sm text-gray-700 hover:text-gray-900 transition-colors" title={`Click to copy: ${id}`}>
      <span className="font-mono">{full ? id : id.slice(0, 8)}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </button>
  );
}

/* ─── Slide-over detail row ──────────────────────────────── */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  );
}

/* ─── Slide-over panel ───────────────────────────────────── */

function UserSlideOver({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(userId));
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.data?.user as UserProfile | null;
    },
    enabled: !!userId,
  });

  const { data: activityData } = useAdminUserActivity(userId, 1);
  const recentLogs = (activityData?.logs ?? []).slice(0, 5);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">User Detail</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.open(`/users/${userId}`, '_blank')}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : !user ? (
            <p className="text-sm text-gray-500 text-center py-12">User not found</p>
          ) : (
            <>
              {/* Profile header */}
              <div className="flex items-center gap-3">
                <Avatar name={user.full_name || ''} />
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-gray-900">{user.full_name || 'Unnamed User'}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>

              {/* User ID */}
              <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500">User ID</span>
                <CopyableId id={user.user_id} full />
              </div>

              {/* Account info */}
              <div className="bg-white rounded-lg border border-gray-100">
                <DetailRow label="Role">
                  <RoleBadge role={user.role} />
                </DetailRow>
                <DetailRow label="Status">
                  <StatusPill verified={!!user.email_verified} />
                </DetailRow>
                <DetailRow label="Package">{user.package?.name || '\u2014'}</DetailRow>
                <DetailRow label="Joined">{format(new Date(user.created_at), 'MMM d, yyyy')}</DetailRow>
                {user.last_sign_in_at && (
                  <DetailRow label="Last sign in">{formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}</DetailRow>
                )}
                {user.phone_number && <DetailRow label="Phone">{user.phone_number}</DetailRow>}
              </div>

              {/* Subscription */}
              {user.package && (
                <div className="bg-white rounded-lg border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Subscription</span>
                  </div>
                  <DetailRow label="Package">{user.package.name}</DetailRow>
                  {user.subscribed_at && <DetailRow label="Subscribed">{format(new Date(user.subscribed_at), 'MMM d, yyyy')}</DetailRow>}
                  {user.expires_at && <DetailRow label="Expires">{format(new Date(user.expires_at), 'MMM d, yyyy')}</DetailRow>}
                  {user.daily_quota_used !== undefined && <DetailRow label="Daily quota used">{user.daily_quota_used}</DetailRow>}
                </div>
              )}

              {/* Recent Activity */}
              {recentLogs.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Activity</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {recentLogs.map((log: any) => (
                      <div key={log.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-700 truncate">{log.event_type || log.action}</span>
                        <span className="text-sm text-gray-500 whitespace-nowrap tabular-nums">{format(new Date(log.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Actions dropdown ───────────────────────────────────── */

function ActionsDropdown({
  user,
  onChangeRole,
  onChangePackage,
  onSuspend,
}: {
  user: UserProfile;
  onChangeRole: (u: UserProfile) => void;
  onChangePackage: (u: UserProfile) => void;
  onSuspend: (u: UserProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onChangeRole(user); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-gray-400" /> Change role
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onChangePackage(user); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-gray-400" /> Change package
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onSuspend(user); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Suspend
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function UsersPage() {
  useAdminPageViewLogger('users', 'Users List');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const limit = 25;

  // Modal state
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [roleModal, setRoleModal] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const { data, isLoading, isFetching, refetch } = useAdminUsers(page, limit);
  const users = data?.users ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalItems = data?.pagination?.total_items ?? 0;

  const { data: packages } = useAdminPackages();
  const changeRole = useChangeUserRole();
  const suspendUser = useSuspendUser();

  const filtered = users.filter((u: UserProfile) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.full_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCloseSlideOver = useCallback(() => setSelectedUserId(null), []);

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const openRoleModal = (u: UserProfile) => { setTargetUser(u); setSelectedRole(u.role); setRoleModal(true); };
  const openPackageModal = (u: UserProfile) => { setTargetUser(u); setSelectedPackageId(u.package_id ?? ''); setPackageModal(true); };
  const openSuspendModal = (u: UserProfile) => { setTargetUser(u); setSuspendModal(true); };

  const handleConfirmRole = async () => {
    if (!targetUser || !selectedRole) return;
    await changeRole.mutateAsync({ userId: targetUser.user_id, newRole: selectedRole });
    invalidateUsers();
    setRoleModal(false);
  };

  const handleConfirmPackage = async () => {
    if (!targetUser) return;
    const pkg = packages?.find((p: PaymentPackage) => p.id === selectedPackageId);
    if (!pkg) return;
    await authenticatedFetch(ADMIN_ENDPOINTS.USER_BY_ID(targetUser.user_id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: pkg.id }),
    });
    invalidateUsers();
    setPackageModal(false);
  };

  const handleConfirmSuspend = async () => {
    if (!targetUser) return;
    await suspendUser.mutateAsync(targetUser.user_id);
    invalidateUsers();
    setSuspendModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalItems.toLocaleString()} registered accounts</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-10">#</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">User</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">ID</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Role</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Package</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Joined</th>
                    <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3 w-14">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user: UserProfile, index: number) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.user_id)}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3.5 text-center text-sm text-gray-700 tabular-nums">{(page - 1) * limit + index + 1}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.full_name || ''} />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-700 truncate">{user.full_name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-700 tabular-nums">{user.user_id.slice(0, 8)}</td>
                      <td className="px-3 py-3.5"><RoleBadge role={user.role} /></td>
                      <td className="px-3 py-3.5 text-sm text-gray-700">{user.package?.name || '\u2014'}</td>
                      <td className="px-3 py-3.5"><StatusPill verified={!!user.email_verified} /></td>
                      <td className="px-3 py-3.5 text-sm text-gray-700 tabular-nums">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</td>
                      <td className="px-3 py-3.5 text-center">
                        <ActionsDropdown
                          user={user}
                          onChangeRole={openRoleModal}
                          onChangePackage={openPackageModal}
                          onSuspend={openSuspendModal}
                        />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-gray-400">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 tabular-nums">
                  Showing {(page - 1) * limit + 1}&ndash;{Math.min(page * limit, totalItems)} of {totalItems}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2 tabular-nums">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Change Role Modal ────────────────────────────── */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Change Role">
        <p className="text-sm text-gray-500 mb-4">
          Select the new role for <span className="font-medium text-gray-900">{targetUser?.full_name || targetUser?.email}</span>.
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
                {role === targetUser?.role && <span className="text-xs text-gray-400 ml-2">(current)</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setRoleModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirmRole} disabled={changeRole.isPending || selectedRole === targetUser?.role}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
            {changeRole.isPending ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </Modal>

      {/* ─── Change Package Modal ─────────────────────────── */}
      <Modal open={packageModal} onClose={() => setPackageModal(false)} title="Change Package">
        <p className="text-sm text-gray-500 mb-4">
          Select the new package for <span className="font-medium text-gray-900">{targetUser?.full_name || targetUser?.email}</span>.
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
                  {pkg.id === targetUser?.package_id && <span className="text-xs text-gray-400 ml-2">(current)</span>}
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
          <button onClick={handleConfirmPackage} disabled={selectedPackageId === targetUser?.package_id}
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
              <span className="font-medium text-gray-700">{targetUser?.full_name || targetUser?.email}</span> will lose access to their account. This action cannot be easily undone.
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

      {/* Slide-over user detail */}
      {selectedUserId && <UserSlideOver userId={selectedUserId} onClose={handleCloseSlideOver} />}
    </div>
  );
}
