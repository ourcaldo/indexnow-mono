'use client';

import { Ban, Key, Zap, Clock, Eye, EyeOff, Package } from 'lucide-react';

interface UserActions {
  suspend: boolean; resetPassword: boolean; editData: boolean;
  resetQuota: boolean; changePackage: boolean; extendSubscription: boolean;
}

interface UserActionsPanelProps {
  actionLoading: UserActions;
  newPassword: string | null;
  showPassword: boolean;
  onTogglePasswordVisibility: () => void;
  onSuspendUser: () => void;
  onResetPassword: () => void;
  onResetQuota: () => void;
  onChangePackage: () => void;
  onExtendSubscription: () => void;
}

export function UserActionsPanel({
  actionLoading, newPassword, showPassword, onTogglePasswordVisibility,
  onSuspendUser, onResetPassword, onResetQuota, onChangePackage, onExtendSubscription,
}: UserActionsPanelProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg">

      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Admin Actions</h3>
      </div>

      <div className="p-4 space-y-1.5">

        {/* Destructive */}
        <button
          onClick={onSuspendUser}
          disabled={actionLoading.suspend}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-md transition-colors disabled:opacity-50 text-left"
        >
          <Ban className="w-4 h-4 flex-shrink-0" />
          {actionLoading.suspend ? 'Processing...' : 'Suspend user'}
        </button>

        <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

        {/* Operational actions */}
        {[
          { icon: Key,     label: 'Reset password',           loading: actionLoading.resetPassword,       onClick: onResetPassword },
          { icon: Zap,     label: 'Reset daily quota',        loading: actionLoading.resetQuota,          onClick: onResetQuota },
          { icon: Package, label: 'Change package',           loading: actionLoading.changePackage,       onClick: onChangePackage },
          { icon: Clock,   label: 'Extend subscription +30d', loading: actionLoading.extendSubscription, onClick: onExtendSubscription },
        ].map(({ icon: Icon, label, loading, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 text-left"
          >
            <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
            {loading ? 'Processing...' : label}
          </button>
        ))}
      </div>

      {/* Generated password reveal */}
      {newPassword && (
        <div className="mx-4 mb-4 p-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New password generated</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Share this with the user securely.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0f0f17] border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white truncate">
              {showPassword ? newPassword : '--------------------'}
            </code>
            <button
              onClick={onTogglePasswordVisibility}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}