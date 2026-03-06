'use client'

import { useState } from 'react'
import { useAccountSettings } from '@indexnow/ui/hooks'
import { Loader2 } from 'lucide-react'

export default function ProfileContent() {
  const {
    loading: accountLoading,
    savingProfile,
    profileForm,
    userEmail,
    setProfileForm,
    handleSaveProfile,
  } = useAccountSettings()

  const [editing, setEditing] = useState(false)

  const onSave = async () => {
    await handleSaveProfile()
    setEditing(false)
  }

  if (accountLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-100" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded bg-gray-100" />
        ))}
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

  return (
    <div className="space-y-8">
      {/* Avatar + name header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {profileForm.full_name || 'Set your name'}
          </h2>
          <p className="text-sm text-gray-400 truncate">{userEmail}</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Profile fields */}
      {editing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              id="full-name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-shadow"
              data-testid="input-full-name"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="Optional — for account recovery"
              value={profileForm.phone_number}
              onChange={(e) => setProfileForm((p) => ({ ...p, phone_number: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-shadow"
              data-testid="input-phone"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              data-testid="button-save-profile"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <span className="text-sm text-gray-500">Full name</span>
            <span className="text-sm font-medium text-gray-900">
              {profileForm.full_name || <span className="text-gray-400 italic">Not set</span>}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm text-gray-500">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-500">Phone</span>
            <span className="text-sm font-medium text-gray-900">
              {profileForm.phone_number || <span className="text-gray-400 italic">Not set</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
