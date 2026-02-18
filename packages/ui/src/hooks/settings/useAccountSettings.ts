'use client';

import { useState, useEffect, useCallback } from 'react';
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
  loadData: () => Promise<void>;
}

/**
 * Shared hook for account settings (profile + password management).
 * Used by both general/page.tsx and profile/page.tsx to avoid
 * duplicating ~200 lines of identical business logic.
 */
export function useAccountSettings(): UseAccountSettingsReturn {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { logDashboardActivity } = useActivityLogger();

  const [loading, setLoading] = useState(true);
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

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const profileResponse = await authenticatedFetch(AUTH_ENDPOINTS.PROFILE, { signal });

        if (signal?.aborted) return;
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Handle both response shapes: { data: { profile } } and { profile }
          const profile = profileData?.data?.profile ?? profileData?.profile;
          if (profile) {
            setProfileForm({
              full_name: profile.full_name || '',
              phone_number: profile.phone_number || '',
              email_notifications: profile.email_notifications || false,
            });
          }
        } else if (profileResponse.status === 404) {
          setProfileForm({
            full_name: user?.email?.split('@')[0] || '',
            phone_number: '',
            email_notifications: false,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        logger.error(
          { error: error instanceof Error ? error : undefined },
          'Error loading profile data'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [user?.email]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadData]);

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
        loadData();
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
  }, [profileForm, addToast, logDashboardActivity, loadData]);

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
    loading,
    savingProfile,
    savingPassword,
    profileForm,
    passwordForm,
    userEmail: user?.email ?? undefined,
    setProfileForm,
    setPasswordForm,
    handleSaveProfile,
    handleChangePassword,
    loadData,
  };
}
