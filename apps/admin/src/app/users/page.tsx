'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUsers, type UserProfile } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';

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
    const matchSearch = !q || (u.full_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Role</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Package</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user: UserProfile) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/users/${user.user_id}`)}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.full_name || ''} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{user.package?.name || '\u2014'}</td>
                      <td className="px-5 py-3.5"><StatusPill verified={!!user.email_confirmed_at} /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-sm text-gray-400">No users found</td>
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
    </div>
  );
}
