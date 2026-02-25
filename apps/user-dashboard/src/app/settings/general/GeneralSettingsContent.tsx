'use client';

import { useState, useEffect } from 'react';
import { usePageViewLogger, useAccountSettings, useActivityLogger } from '@indexnow/ui/hooks';
import { useToast } from '@indexnow/ui';
import { AUTH_ENDPOINTS } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { Loader2 } from 'lucide-react';

export default function GeneralSettingsPage() {
  const { addToast } = useToast();
  const {
    loading: accountLoading,
    savingProfile,
    savingPassword,
    profileForm,
    passwordForm,
    userEmail,
    setProfileForm,
    setPasswordForm,
    handleSaveProfile,
    handleChangePassword,
  } = useAccountSettings();
  const [savingNotifications, setSavingNotifications] = useState(false);

  usePageViewLogger('/settings/general', 'Account Settings', {
    section: 'account_settings',
  });
  const { logDashboardActivity } = useActivityLogger();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    jobCompletion: true,
    failures: true,
    dailyReports: true,
    criticalAlerts: true,
  });

  // Load notification settings (profile/password are handled by useAccountSettings)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const settingsResponse = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS);
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          const settings = settingsData.data?.settings ?? settingsData.settings;
          setNotifications({
            jobCompletion: settings.email_job_completion || false,
            failures: settings.email_job_failure || false,
            dailyReports: settings.email_daily_report || false,
            criticalAlerts: settings.email_quota_alerts || false,
          });
        }
      } catch (_err) {
        // silently fail - defaults are sensible
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      const response = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify({
          email_job_completion: notifications.jobCompletion,
          email_job_failure: notifications.failures,
          email_daily_report: notifications.dailyReports,
          email_quota_alerts: notifications.criticalAlerts,
        }),
      });

      if (response.ok) {
        addToast({
          title: 'Success',
          description: 'Notification settings updated successfully',
          type: 'success',
        });
        await logDashboardActivity('settings_update', 'Notification settings updated', {
          section: 'notifications',
          changes: { notifications },
        });
      } else {
        const error = await response.json();
        addToast({
          title: 'Failed to update settings',
          description: error.error || 'Something went wrong',
          type: 'error',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update settings',
        type: 'error',
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  if (accountLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white dark:bg-[#141520] p-6 border border-gray-200 dark:border-gray-800">
            <div className="mb-4 h-5 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-3">
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your account details.</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <input
                type="text"
                id="full-name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                data-testid="input-full-name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={userEmail || ''}
                readOnly
                className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-3 py-2 text-sm"
                data-testid="input-email"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone number
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="Optional - for account recovery"
                value={profileForm.phone_number}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                data-testid="input-phone"
              />
            </div>
          </div>
        </div>
        <div className="rounded-b-xl bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800 px-6 py-4 text-right">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
            data-testid="button-save-profile"
          >
            {savingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Security & Password */}
      <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security & Password</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Keep your account secure.</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-6">
          <div className="max-w-md space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current password
              </label>
              <input
                type="password"
                id="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                data-testid="input-current-password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New password
              </label>
              <input
                type="password"
                id="new-password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm new password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
        </div>
        <div className="rounded-b-xl bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800 px-6 py-4 text-right">
          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
            data-testid="button-update-password"
          >
            {savingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="rounded-xl bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose what updates you want to receive.</p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          <li className="flex items-center justify-between px-6 py-4">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Rank tracking updates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get notified when rank tracking checks complete.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.jobCompletion}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, jobCompletion: e.target.checked }))
                }
                data-testid="switch-jobCompletion"
              />
              <div
                className={`h-6 w-11 rounded-full border border-gray-200 dark:border-gray-700 transition-colors duration-200 ease-in-out ${notifications.jobCompletion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div
                  className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${notifications.jobCompletion ? 'translate-x-5' : 'translate-x-0'}`}
                ></div>
              </div>
            </label>
          </li>
          <li className="flex items-center justify-between px-6 py-4">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Failure alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Immediate notifications for failed jobs.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.failures}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, failures: e.target.checked }))
                }
                data-testid="switch-failures"
              />
              <div
                className={`h-6 w-11 rounded-full border border-gray-200 dark:border-gray-700 transition-colors duration-200 ease-in-out ${notifications.failures ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div
                  className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${notifications.failures ? 'translate-x-5' : 'translate-x-0'}`}
                ></div>
              </div>
            </label>
          </li>
          <li className="flex items-center justify-between px-6 py-4">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Daily summaries</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Digest of your account activity.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={notifications.dailyReports}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, dailyReports: e.target.checked }))
                }
                data-testid="switch-dailyReports"
              />
              <div
                className={`h-6 w-11 rounded-full border border-gray-200 dark:border-gray-700 transition-colors duration-200 ease-in-out ${notifications.dailyReports ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <div
                  className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${notifications.dailyReports ? 'translate-x-5' : 'translate-x-0'}`}
                ></div>
              </div>
            </label>
          </li>
        </ul>
        <div className="rounded-b-xl bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800 px-6 py-4 text-right">
          <button
            onClick={handleSaveNotifications}
            disabled={savingNotifications}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
            data-testid="button-save-notifications"
          >
            {savingNotifications ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
