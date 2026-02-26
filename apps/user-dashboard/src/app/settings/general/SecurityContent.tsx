'use client'

import { useState } from 'react'
import { useAccountSettings } from '@indexnow/ui/hooks'
import { Loader2, Eye, EyeOff } from 'lucide-react'

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
        className="block w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 px-3 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
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

export default function SecurityContent() {
  const {
    loading: accountLoading,
    savingPassword,
    passwordForm,
    setPasswordForm,
    handleChangePassword,
  } = useAccountSettings()

  const [showForm, setShowForm] = useState(false)

  const onSubmit = async () => {
    await handleChangePassword()
    setShowForm(false)
  }

  if (accountLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-12 rounded bg-gray-100 dark:bg-gray-800/50" />
      </div>
    )
  }

  if (!showForm) {
    return (
      <div>
        <button
          onClick={() => setShowForm(true)}
          className="group w-full flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800/60 text-left"
        >
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Change your account password</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors">
            Change
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          onClick={onSubmit}
          disabled={savingPassword}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          data-testid="button-update-password"
        >
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
