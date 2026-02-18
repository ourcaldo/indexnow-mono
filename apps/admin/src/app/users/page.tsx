'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Ban,
  Shield,
  Mail,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { AdminPageSkeleton } from '@indexnow/ui';
import { ConfirmationDialog } from '@indexnow/ui/modals';
import { useAdminUsers, useChangeUserRole, useSuspendUser, type UserProfile } from '@/hooks';

export default function UserManagement() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading: loading, refetch } = useAdminUsers(currentPage, pageSize);
  const changeRoleMutation = useChangeUserRole();
  const suspendMutation = useSuspendUser();

  const users = data?.users ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalItems = data?.pagination?.total_items ?? 0;

  // (#117) Confirmation dialog state for destructive actions
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'destructive' | 'primary';
    onConfirm: () => void;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
    loading: false,
  });

  // (#117) Wrap role change with confirmation dialog
  const confirmRoleChange = (userId: string, newRole: string, userName: string | null) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Change User Role',
      message: `Are you sure you want to change ${userName || 'this user'}'s role to "${newRole}"?`,
      variant: 'primary',
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await changeRoleMutation.mutateAsync({ userId, newRole });
        } catch {
          // Error handled by mutation's onError
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
      },
    });
  };

  // (#117) Wrap suspend with confirmation dialog
  const confirmSuspendUser = (userId: string, userName: string | null) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Suspend User',
      message: `Are you sure you want to suspend ${userName || 'this user'}? They will lose access to their account.`,
      variant: 'destructive',
      loading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          await suspendMutation.mutateAsync(userId);
        } catch {
          // Error handled by mutation's onError
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'admin':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'user':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (user: UserProfile) => {
    if (user.email_confirmed_at) {
      return <CheckCircle className="text-success h-4 w-4" />;
    } else {
      return <AlertTriangle className="text-warning h-4 w-4" />;
    }
  };

  if (loading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="border-border rounded-lg border bg-white p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-accent/10 rounded-lg p-2">
              <Users className="text-accent h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-lg font-bold">{users.length}</p>
              <p className="text-muted-foreground text-xs">Total Users</p>
            </div>
          </div>
        </div>
        <div className="border-border rounded-lg border bg-white p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-success/10 rounded-lg p-2">
              <Shield className="text-success h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-lg font-bold">
                {users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length}
              </p>
              <p className="text-muted-foreground text-xs">Admins</p>
            </div>
          </div>
        </div>
        <div className="border-border rounded-lg border bg-white p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-warning/10 rounded-lg p-2">
              <CheckCircle className="text-warning h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-lg font-bold">
                {users.filter((u) => u.email_confirmed_at).length}
              </p>
              <p className="text-muted-foreground text-xs">Verified</p>
            </div>
          </div>
        </div>
        <div className="border-border rounded-lg border bg-white p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-destructive/10 rounded-lg p-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground text-lg font-bold">
                {users.filter((u) => !u.email_confirmed_at).length}
              </p>
              <p className="text-muted-foreground text-xs">Unverified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-border rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-border focus:ring-accent w-full rounded-lg border py-2 pr-4 pl-10 focus:border-transparent focus:ring-2"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border-border focus:ring-accent rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border-border overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-border border-b">
              <tr>
                <th className="text-foreground px-4 py-3 text-left font-medium">User</th>
                <th className="text-foreground px-4 py-3 text-left font-medium">Role</th>
                <th className="text-foreground px-4 py-3 text-left font-medium">Package</th>
                <th className="text-foreground px-4 py-3 text-left font-medium">Status</th>
                <th className="text-foreground px-4 py-3 text-left font-medium">Joined</th>
                <th className="text-foreground px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => router.push(`/users/${user.user_id}`)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="text-accent text-sm font-medium">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {user.full_name || 'No name'}
                        </p>
                        <p className="text-muted-foreground text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getRoleColor(user.role)}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                          user.package?.slug === 'free'
                            ? 'bg-muted/10 text-muted-foreground border-muted/20'
                            : user.package?.slug === 'premium'
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : user.package?.slug === 'pro'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : 'bg-muted/10 text-muted-foreground border-muted/20'
                        }`}
                      >
                        {user.package?.name || 'No Package'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user)}
                      <span className="text-muted-foreground text-sm">
                        {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.user_id}`);
                        }}
                        className="text-muted-foreground hover:text-accent hover:bg-accent/10 rounded p-1 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.user_id}`);
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded p-1 transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Quick actions could be implemented here
                        }}
                        className="text-muted-foreground hover:text-warning hover:bg-warning/10 rounded p-1 transition-colors"
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmSuspendUser(user.user_id, user.full_name);
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                        title="Suspend User"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No users found matching your criteria</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-border bg-background hover:bg-accent rounded border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-border bg-background hover:bg-accent rounded border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* (#117) Confirmation dialog for destructive actions */}
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant as 'destructive' | 'primary'}
        loading={confirmConfig.loading}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
