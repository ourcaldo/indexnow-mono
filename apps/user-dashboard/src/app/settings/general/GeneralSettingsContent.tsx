'use client'

import { useState, useEffect } from 'react'
import { usePageViewLogger, useAccountSettings, useActivityLogger } from '@indexnow/ui/hooks'
import { useToast } from '@indexnow/ui'
import { AUTH_ENDPOINTS } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'
import {
  Loader2,
  Pencil,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'

/* ─── Toggle Switch ─── */
function Toggle({
  checked,
  onChange,
  testId,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  testId?: string
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <div
        className={`h-[22px] w-10 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <div
          className={`mt-[2px] ml-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  )
}

/* ─── Password Input with visibility toggle ─── */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  testId,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  testId?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
        data-testid={testId}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════ */

export default function GeneralSettingsPage() {
  const { addToast } = useToast()
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
  } = useAccountSettings()

  usePageViewLogger('/settings/general', 'Account Settings', { section: 'account_settings' })
  const { logDashboardActivity } = useActivityLogger()

  const [loading, setLoading] = useState(true)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [notifications, setNotifications] = useState({
    jobCompletion: true,
    failures: true,
    dailyReports: true,
    criticalAlerts: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS)
        if (res.ok) {
          const json = await res.json()
          const s = json.data?.settings ?? json.settings
          setNotifications({
            jobCompletion: s.email_job_completion || false,
            failures: s.email_job_failure || false,
            dailyReports: s.email_daily_report || false,
            criticalAlerts: s.email_quota_alerts || false,
          })
        }
      } catch {
        /* defaults are fine */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveNotifications = async () => {
    try {
      setSavingNotifications(true)
      const res = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify({
          email_job_completion: notifications.jobCompletion,
          email_job_failure: notifications.failures,
          email_daily_report: notifications.dailyReports,
          email_quota_alerts: notifications.criticalAlerts,
        }),
      })
      if (res.ok) {
        addToast({ title: 'Saved', description: 'Notification preferences updated', type: 'success' })
        await logDashboardActivity('settings_update', 'Notification settings updated', {
          section: 'notifications',
          changes: { notifications },
        })
      } else {
        const err = await res.json()
        addToast({ title: 'Error', description: err.error || 'Something went wrong', type: 'error' })
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to update settings', type: 'error' })
    } finally {
      setSavingNotifications(false)
    }
  }

  const onSaveProfile = async () => {
    await handleSaveProfile()
    setEditingProfile(false)
  }

  const onChangePassword = async () => {
    await handleChangePassword()
    setShowPassword(false)
  }

  /* ── Loading ── */
  if (accountLoading || loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800/50" />
          ))}
        </div>
        <div className="h-4 w-32 mt-6 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded bg-gray-100 dark:bg-gray-800/50" />
          ))}
        </div>
      </div>
    )
  }

  const initials = profileForm.full_name
    ? profileForm.full_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : userEmail?.charAt(0).toUpperCase() || 'U'

  /* ─────────────────── RENDER ─────────────────── */

  return (
    <div className="space-y-10">
      {/* ═══ Profile header ═══ */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {profileForm.full_name || 'Set your name'}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
        </div>
        {!editingProfile && (
          <button
            onClick={() => setEditingProfile(true)}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Edit profile
          </button>
        )}
      </div>

      {/* ═══ Two-Column Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* ── Left Column (3/5): Profile + Security ── */}
        <div className="lg:col-span-3 space-y-10">

          {/* — Profile Section — */}
          <section>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-4">Profile</h3>

            {editingProfile ? (
              /* ──── Edit Mode ──── */
              <div className="space-y-4">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="full-name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                    data-testid="input-full-name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Optional — for account recovery"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone_number: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                    data-testid="input-phone"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={onSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    data-testid="button-save-profile"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ──── View Mode (key-value rows) ──── */
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Full name</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profileForm.full_name || <span className="text-gray-400 italic">Not set</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profileForm.phone_number || <span className="text-gray-400 italic">Not set</span>}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* — Security Section — */}
          <section>
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-4">Security</h3>

            {!showPassword ? (
              /* Collapsed state */
              <button
                onClick={() => setShowPassword(true)}
                className="group w-full flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800/60 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Change your account password</p>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Change</span>
              </button>
            ) : (
              /* Expanded inline form */
              <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-gray-800/60">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Current password
                  </label>
                  <PasswordInput
                    id="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))}
                    placeholder="Enter current password"
                    testId="input-current-password"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New password
                  </label>
                  <PasswordInput
                    id="new-password"
                    value={passwordForm.newPassword}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))}
                    placeholder="Minimum 8 characters"
                    testId="input-new-password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm new password
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    value={passwordForm.confirmPassword}
                    onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))}
                    placeholder="Re-enter new password"
                    testId="input-confirm-password"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onChangePassword}
                    disabled={savingPassword}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    data-testid="button-update-password"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => setShowPassword(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Right Column (2/5): Notifications ── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-4">Notifications</h3>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {[
                {
                  key: 'jobCompletion' as const,
                  label: 'Rank tracking',
                  desc: 'When tracking checks complete',
                },
                {
                  key: 'failures' as const,
                  label: 'Failure alerts',
                  desc: 'Immediate notifications for failed jobs',
                },
                {
                  key: 'dailyReports' as const,
                  label: 'Daily digest',
                  desc: 'Summary of your account activity',
                },
                {
                  key: 'criticalAlerts' as const,
                  label: 'Quota warnings',
                  desc: 'When approaching usage limits',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3">
                  <div className="pr-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[item.key]}
                    onChange={(v) => setNotifications((p) => ({ ...p, [item.key]: v }))}
                    testId={`switch-${item.key}`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              data-testid="button-save-notifications"
            >
              {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingNotifications ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
