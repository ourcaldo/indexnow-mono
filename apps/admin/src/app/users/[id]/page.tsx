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

  if (loading) return <div className="py-20 text-center text-sm text-gray-400">Loading user…</div>;
  if (!user) return (
    <div className="py-20 text-center space-y-2">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">User not found</p>
      <p className="text-xs text-gray-500">The user you're looking for doesn't exist.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">User Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage user account and permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white/10 text-white border border-gray-700 dark:border-white/10 rounded-md hover:bg-gray-800 dark:hover:bg-white/[0.15] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit user
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSaveEditWithRefresh}
                disabled={actionLoading.editData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {actionLoading.editData ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <UserProfileCard user={user} editMode={editMode} editForm={editForm} onEditFormChange={handleEditFormChange} />
      <PackageSubscriptionCard user={user} />
      <UserActionsPanel
        actionLoading={actionLoading} newPassword={newPassword} showPassword={showPassword}
        onTogglePasswordVisibility={handleTogglePasswordVisibility}
        onSuspendUser={handleSuspendUserWithRefresh} onResetPassword={handleResetPasswordWithCallback}
        onResetQuota={handleResetQuotaWithRefresh} onChangePackage={handleChangePackage}
        onExtendSubscription={handleExtendSubscriptionWithRefresh}
      />
      <UserActivityCard activityLogs={activityLogs} activityLoading={activityLoading} />
      <UserSecurityCard securityData={securityData} securityLoading={securityLoading} />
      <PackageChangeModal
        isOpen={showPackageModal} availablePackages={availablePackages}
        selectedPackageId={selectedPackageId} changePackageLoading={actionLoading.changePackage}
        onClose={() => setShowPackageModal(false)} onPackageSelect={setSelectedPackageId}
        onSubmit={handlePackageChangeSubmitWithRefresh}
      />
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message}
        confirmText={confirmConfig.confirmText} variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
