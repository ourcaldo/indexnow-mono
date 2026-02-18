'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Save, X, XCircle } from 'lucide-react';

// Import extracted components
import { UserProfileCard } from './components/UserProfileCard';
import { UserActionsPanel } from './components/UserActionsPanel';
import { PackageSubscriptionCard } from './components/PackageSubscriptionCard';
import { UserActivityCard } from './components/UserActivityCard';
import { UserSecurityCard } from './components/UserSecurityCard';
import { PackageChangeModal } from './components/PackageChangeModal';
import { AdminUserDetailSkeleton, ErrorState } from '@indexnow/ui';
import { ConfirmationDialog } from '@indexnow/ui/modals';

// Import custom hooks
import { useUserData } from './hooks/useUserData';
import { useUserManagement } from './hooks/useUserManagement';

export default function UserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Use custom hooks
  const {
    user,
    activityLogs,
    securityData,
    availablePackages,
    loading,
    activityLoading,
    securityLoading,
    fetchUser,
    fetchUserActivity,
    fetchUserSecurity,
  } = useUserData(userId);

  const {
    actionLoading,
    newPassword,
    showPassword,
    editMode,
    editForm,
    showPackageModal,
    selectedPackageId,
    confirmConfig,
    setEditMode,
    setEditForm,
    setShowPackageModal,
    setSelectedPackageId,
    setConfirmConfig,
    handleSuspendUser,
    handleResetPassword,
    handleResetQuota,
    handleChangePackage,
    handleExtendSubscription,
    handleSaveEdit,
    handlePackageChangeSubmit,
    handleEditFormChange,
    handleTogglePasswordVisibility,
  } = useUserManagement();

  // Initialize edit form when user data is loaded
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

  // Action handlers with callback functions
  const handleSuspendUserWithRefresh = () => handleSuspendUser(userId, fetchUser);
  const handleResetPasswordWithCallback = () => handleResetPassword(userId);
  const handleResetQuotaWithRefresh = () => handleResetQuota(userId, fetchUser);
  const handleExtendSubscriptionWithRefresh = () => handleExtendSubscription(userId, fetchUser);
  const handleSaveEditWithRefresh = () =>
    handleSaveEdit(userId, editForm, () => {
      fetchUser();
      fetchUserActivity();
      fetchUserSecurity();
    });
  const handlePackageChangeSubmitWithRefresh = () =>
    handlePackageChangeSubmit(userId, selectedPackageId, fetchUser);

  // Loading state
  if (loading) {
    return <AdminUserDetailSkeleton />;
  }

  // User not found state
  if (!user) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center">
        <ErrorState
          title="User Not Found"
          message="The user you're looking for doesn't exist."
          showHomeButton
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground mt-1">Manage user account and permissions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit User</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="border-border text-muted-foreground hover:bg-secondary flex items-center space-x-2 rounded-lg border px-4 py-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveEditWithRefresh}
                disabled={actionLoading.editData}
                className="bg-success text-success-foreground hover:bg-success/90 flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{actionLoading.editData ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* User Profile Card */}
      <UserProfileCard
        user={user}
        editMode={editMode}
        editForm={editForm}
        onEditFormChange={handleEditFormChange}
      />

      {/* Package Subscription Card */}
      <PackageSubscriptionCard user={user} />

      {/* Admin Actions Panel */}
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

      {/* Recent Activity Card */}
      <UserActivityCard activityLogs={activityLogs} activityLoading={activityLoading} />

      {/* Security Overview Card */}
      <UserSecurityCard securityData={securityData} securityLoading={securityLoading} />

      {/* Package Change Modal */}
      <PackageChangeModal
        isOpen={showPackageModal}
        availablePackages={availablePackages}
        selectedPackageId={selectedPackageId}
        changePackageLoading={actionLoading.changePackage}
        onClose={() => setShowPackageModal(false)}
        onPackageSelect={setSelectedPackageId}
        onSubmit={handlePackageChangeSubmitWithRefresh}
      />

      {/* Confirmation Dialog */}
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
