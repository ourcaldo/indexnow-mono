'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { UserProfileCard } from './components/UserProfileCard';
import { UserActionsPanel } from './components/UserActionsPanel';
import { PackageSubscriptionCard } from './components/PackageSubscriptionCard';
import { UserActivityCard } from './components/UserActivityCard';
import { UserSecurityCard } from './components/UserSecurityCard';
import { PackageChangeModal } from './components/PackageChangeModal';
import { useUserData } from './hooks/useUserData';
import { useUserManagement } from './hooks/useUserManagement';
import type { UserProfile } from './components/index';

function IdentityStrip({ user, editMode, onEditMode, onSave, onCancel, saving }: {
  user: UserProfile;
  editMode: boolean;
  onEditMode: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const initial = (user.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();
  return (
    <div className="flex items-center gap-5 pb-6 border-b border-gray-200 dark:border-gray-800">
      {/* Back */}
      <button
        onClick={() => window.history.back()}
        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex-shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center flex-shrink-0">
        <span className="text-xl font-bold text-gray-600 dark:text-gray-300 select-none">{initial}</span>
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight truncate">
          {user.full_name || user.email || 'Unknown user'}
        </h1>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-gray-300">
            {user.role.replace(/_/g, ' ')}
          </span>
          {user.email_confirmed_at
            ? <span className="text-xs text-emerald-600 dark:text-emerald-400">Verified</span>
            : <span className="text-xs text-amber-600 dark:text-amber-400">Unverified</span>
          }
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!editMode ? (
          <button
            onClick={onEditMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white/10 text-white border border-gray-700 dark:border-white/10 rounded-md hover:bg-gray-800 dark:hover:bg-white/[0.15] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit user
          </button>
        ) : (
          <>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmationDialog({ isOpen, title, message, confirmText, variant, onConfirm, onClose }: {
  isOpen: boolean; title: string; message: string; confirmText?: string; variant?: string;
  onConfirm: () => void; onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm rounded-md text-white transition-colors ${variant === 'destructive' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500'}`}
          >
            {confirmText ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { user, activityLogs, securityData, availablePackages, loading, activityLoading, securityLoading,
    fetchUser, fetchUserActivity, fetchUserSecurity } = useUserData(userId);

  const { actionLoading, newPassword, showPassword, editMode, editForm, showPackageModal,
    selectedPackageId, confirmConfig, setEditMode, setEditForm, setShowPackageModal,
    setSelectedPackageId, setConfirmConfig, handleSuspendUser, handleResetPassword,
    handleResetQuota, handleChangePackage, handleExtendSubscription, handleSaveEdit,
    handlePackageChangeSubmit, handleEditFormChange, handleTogglePasswordVisibility,
  } = useUserManagement();

  useEffect(() => {
    if (user && !editMode) {
      setEditForm({
        full_name: user.full_name || '',
        role: user.role || '',
        email_notifications: user.email_notifications || false,
        phone_number: user.phone_number || '',
      });
    }
  }, [user, editMode, setEditForm]);

  const handleSuspendUserWithRefresh = () => handleSuspendUser(userId, fetchUser);
  const handleResetPasswordWithCallback = () => handleResetPassword(userId);
  const handleResetQuotaWithRefresh = () => handleResetQuota(userId, fetchUser);
  const handleExtendSubscriptionWithRefresh = () => handleExtendSubscription(userId, fetchUser);
  const handleSaveEditWithRefresh = () => handleSaveEdit(userId, editForm, () => { fetchUser(); fetchUserActivity(); fetchUserSecurity(); });
  const handlePackageChangeSubmitWithRefresh = () => handlePackageChangeSubmit(userId, selectedPackageId, fetchUser);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-64 bg-gray-100 dark:bg-gray-700/50 rounded" />
          </div>
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800/30 rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-2">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">User not found</p>
        <p className="text-xs text-gray-500">The user you are looking for does not exist.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Identity strip - full width header */}
      <IdentityStrip
        user={user}
        editMode={editMode}
        onEditMode={() => setEditMode(true)}
        onSave={handleSaveEditWithRefresh}
        onCancel={() => setEditMode(false)}
        saving={actionLoading.editData}
      />

      {/* Two-column main layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* LEFT: Profile + Subscription + Activity */}
        <div className="space-y-6">
          <UserProfileCard
            user={user}
            editMode={editMode}
            editForm={editForm}
            onEditFormChange={handleEditFormChange}
          />
          <PackageSubscriptionCard user={user} />
          <UserActivityCard
            activityLogs={activityLogs}
            activityLoading={activityLoading}
          />
        </div>

        {/* RIGHT: Actions + Security */}
        <div className="space-y-6">
          <UserActionsPanel
            actionLoading={actionLoading}
            newPassword={newPassword}
            showPassword={showPassword}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onSuspendUser={handleSuspendUserWithRefresh}
            onResetPassword={handleResetPasswordWithCallback}
            onResetQuota={handleResetQuotaWithRefresh}
            onChangePackage={handleChangePackage}
            onExtendSubscription={handleExtendSubscriptionWithRefresh}
          />
          <UserSecurityCard
            securityData={securityData}
            securityLoading={securityLoading}
          />
        </div>
      </div>

      {/* Modals */}
      <PackageChangeModal
        isOpen={showPackageModal}
        availablePackages={availablePackages}
        selectedPackageId={selectedPackageId}
        changePackageLoading={actionLoading.changePackage}
        onClose={() => setShowPackageModal(false)}
        onPackageSelect={setSelectedPackageId}
        onSubmit={handlePackageChangeSubmitWithRefresh}
      />
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}