'use client';

import { Ban, Key, Zap, Clock, Eye, EyeOff, Package } from 'lucide-react';

interface UserActions {
  suspend: boolean; resetPassword: boolean; editData: boolean;
  resetQuota: boolean; changePackage: boolean; extendSubscription: boolean;
}
interface UserActionsPanel {
  actionLoading: UserActions; newPassword: string | null; showPassword: boolean;
  onTogglePasswordVisibility: () => void; onSuspendUser: () => void;
  onResetPassword: () => void; onResetQuota: () => void;
  onChangePackage: () => void; onExtendSubscription: () => void;
}

function ActionBtn({ onClick, disabled, cls, children }: {
  onClick: () => void; disabled?: boolean; cls?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function UserActionsPanel({
  actionLoading, newPassword, showPassword, onTogglePasswordVisibility,
  onSuspendUser, onResetPassword, onResetQuota, onChangePackage, onExtendSubscription,
}: UserActionsPanel) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Admin Actions</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage account settings and permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ActionBtn
          onClick={onSuspendUser} disabled={actionLoading.suspend}
          cls="bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/20"
        >
          <Ban className="w-4 h-4" />
          {actionLoading.suspend ? 'Processing…' : 'Suspend user'}
        </ActionBtn>

        <ActionBtn
          onClick={onResetPassword} disabled={actionLoading.resetPassword}
          cls="bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20"
        >
          <Key className="w-4 h-4" />
          {actionLoading.resetPassword ? 'Resetting…' : 'Reset password'}
        </ActionBtn>

        <ActionBtn
          onClick={onResetQuota} disabled={actionLoading.resetQuota}
          cls="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Zap className="w-4 h-4" />
          {actionLoading.resetQuota ? 'Resetting…' : 'Reset daily quota'}
        </ActionBtn>

        <ActionBtn
          onClick={onChangePackage} disabled={actionLoading.changePackage}
          cls="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Package className="w-4 h-4" />
          {actionLoading.changePackage ? 'Changing…' : 'Change package'}
        </ActionBtn>

        <ActionBtn
          onClick={onExtendSubscription} disabled={actionLoading.extendSubscription}
          cls="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 sm:col-span-1"
        >
          <Clock className="w-4 h-4" />
          {actionLoading.extendSubscription ? 'Extending…' : 'Extend subscription (+30 days)'}
        </ActionBtn>
      </div>

      {newPassword && (
        <div className="mt-5 p-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password generated</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Share this password securely with the user.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0f0f17] border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white">
              {showPassword ? newPassword : '••••••••••••'}
            </code>
            <button onClick={onTogglePasswordVisibility} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
