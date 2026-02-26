'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AUTH_ENDPOINTS, logger } from '@indexnow/shared';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';
import { useAuth } from '@indexnow/auth';
import { useToast } from '../../components/toast';
import { useActivityLogger } from '../useActivityLogger';

export interface ProfileFormData {
  full_name: string;
  phone_number: string;
  email_notifications: boolean;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UseAccountSettingsReturn {
  // State
  loading: boolean;
  savingProfile: boolean;
  savingPassword: boolean;
  profileForm: ProfileFormData;
  passwordForm: PasswordFormData;
  userEmail: string | undefined;
  // Setters
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormData>>;
  // Actions
  handleSaveProfile: () => Promise<void>;
  handleChangePassword: () => Promise<void>;
}

/**
 * Shared hook for account settings (profile + password management).
 * Used by ProfileContent and SecurityContent.
 *
 * Profile data is loaded via React Query (query key: ['profile']) — the SAME
 * cache used by useProfile() in the sidebar. This means:
 * - No duplicate /v1/auth/user/profile fetch on settings pages
 * - Instant data on tab switch (served from cache)
 * - Sidebar automatically updates after profile save
 */
export function useAccountSettings(): UseAccountSettingsReturn {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { logDashboardActivity } = useActivityLogger();
  const queryClient = useQueryClient();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    full_name: '',
    phone_number: '',
    email_notifications: false,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load profile via React Query — shares cache with useProfile() in AppSidebar
  const { data: profileQueryData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE);
      if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
      const json = await res.json();
      // Unwrap standardized response: { success: true, data: { profile: ... } }
      const data = json?.data ?? json;
      return data as { profile: { full_name?: string; phone_number?: string; email_notifications?: boolean; email?: string; [key: string]: unknown } };
    },
  });

  // Sync React Query data → local form state (only when query data changes)
  useEffect(() => {
    const profile = profileQueryData?.profile;
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        email_notifications: profile.email_notifications || false,
      });
    } else if (!profileLoading && !profileQueryData) {
      // Profile not found — fallback to email prefix
      setProfileForm({
        full_name: user?.email?.split('@')[0] || '',
        phone_number: '',
        email_notifications: false,
      });
    }
  }, [profileQueryData, profileLoading, user?.email]);

  const handleSaveProfile = useCallback(async () => {
    try {
      setSavingProfile(true);
      const response = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        addToast({
          title: 'Success',
          description: 'Profile updated successfully',
          type: 'success',
        });
        await logDashboardActivity('profile_update', 'Profile information updated');
        // Invalidate React Query cache so sidebar + all consumers get fresh data
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-aggregate'] });
      } else {
        const error = await response.json();
        addToast({
          title: 'Failed to update profile',
          description: error.error || 'Something went wrong',
          type: 'error',
        });
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error saving profile');
      addToast({
        title: 'Error',
        description: 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  }, [profileForm, addToast, logDashboardActivity, queryClient]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast({
        title: 'Validation Error',
        description: 'Please fill in all password fields',
        type: 'error',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({
        title: 'Validation Error',
        description: 'New passwords do not match',
        type: 'error',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long',
        type: 'error',
      });
      return;
    }

    try {
      setSavingPassword(true);

      if (!user?.email) {
        addToast({
          title: 'Error',
          description: 'User email not found',
          type: 'error',
        });
        return;
      }

      try {
        await authService.signIn(user.email, passwordForm.currentPassword);
      } catch (_err) {
        addToast({
          title: 'Authentication Error',
          description: 'Current password is incorrect',
          type: 'error',
        });
        return;
      }

      try {
        await authService.updateUser({
          password: passwordForm.newPassword,
        });
      } catch (updateError: unknown) {
        addToast({
          title: 'Update Error',
          description:
            updateError instanceof Error ? updateError.message : 'Failed to update password',
          type: 'error',
        });
        return;
      }

      addToast({
        title: 'Success',
        description: 'Password updated successfully',
        type: 'success',
      });

      await logDashboardActivity('password_change', 'Password updated successfully');

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Error changing password'
      );
      addToast({
        title: 'Error',
        description: 'Failed to change password',
        type: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  }, [passwordForm, user?.email, addToast, logDashboardActivity]);

  return {
    loading: profileLoading,
    savingProfile,
    savingPassword,
    profileForm,
    passwordForm,
    userEmail: user?.email ?? undefined,
    setProfileForm,
    setPasswordForm,
    handleSaveProfile,
    handleChangePassword,
  };
}
