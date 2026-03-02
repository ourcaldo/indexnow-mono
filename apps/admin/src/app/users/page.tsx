'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUsers, type UserProfile } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';

function RoleBadge({ role }: { role: string }) {
  const label = role.replace(/_/g, ' ');
  if (role === 'super_admin')
    return <span className="text-[13px] text-white font-medium">{label}</span>;
  if (role === 'admin')
    return <span className="text-[13px] text-gray-300 font-medium">{label}</span>;
  return <span className="text-[13px] text-gray-500">{label}</span>;
}

function StatusDot({ verified }: { verified: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span
        className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-emerald-400' : 'bg-amber-400'}`}
      />
      <span className="text-gray-400">{verified ? 'Verified' : 'Unverified'}</span>
    </span>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, isFetching, refetch } = useAdminUsers(page, limit);
  const users = data?.users ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalItems = data?.pagination?.total_items ?? 0;

  const filtered = users.filter((u: UserProfile) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Users</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {totalItems.toLocaleString()} accounts
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-400 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-gray-200 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-300 focus:outline-none"
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_100px_120px_90px_90px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>User</span>
            <span>Role</span>
            <span>Package</span>
            <span>Status</span>
            <span>Joined</span>
          </div>

          {/* Rows */}
          <div className="border-t border-white/[0.04]">
            {filtered.map((user: UserProfile) => (
              <div
                key={user.id}
                onClick={() => router.push(`/users/${user.user_id}`)}
                className="grid grid-cols-[1fr_100px_120px_90px_90px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13px] text-white font-medium truncate">
                    {user.full_name || 'Unnamed'}
                  </div>
                  <div className="text-[12px] text-gray-600 truncate">{user.email}</div>
                </div>
                <div className="flex items-center">
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex items-center text-[13px] text-gray-400 truncate">
                  {user.package?.name || '—'}
                </div>
                <div className="flex items-center">
                  <StatusDot verified={!!user.email_confirmed_at} />
                </div>
                <div className="flex items-center text-[12px] text-gray-600 tabular-nums">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-600">No users found</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04]">
              <span className="text-[12px] text-gray-600">
                {(page - 1) * limit + 1}–{Math.min(page * limit, totalItems)} of {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] text-gray-500 px-2 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
