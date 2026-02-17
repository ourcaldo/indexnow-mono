'use client'

import { useState } from 'react'
import { usePageViewLogger, useAccountSettings } from '@indexnow/ui/hooks'
import {
  Button,
  Input,
  Label,
} from '@indexnow/ui'
import { SettingCard, SettingInput } from '@indexnow/ui/settings'
import {
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  KeyRound
} from 'lucide-react'

export default function ProfileSettingsPage() {
  const {
    loading,
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

  usePageViewLogger('/dashboard/settings/profile', 'Profile Settings', { section: 'profile_settings' })
  const [showPassword, setShowPassword] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Information Skeleton */}
          <div className="space-y-4 p-6 bg-card border rounded-lg">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>

          {/* Password Change Skeleton */}
          <div className="space-y-4 p-6 bg-card border rounded-lg">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-36 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <SettingCard
          title="Profile Information"
          description="Update your personal details and contact information"
        >
          <div className="space-y-4">
            <SettingInput
              id="full-name"
              label="Full Name"
              placeholder="Enter your full name"
              value={profileForm.full_name}
              onChange={(value) => setProfileForm(prev => ({ ...prev, full_name: value }))}
            />

            <SettingInput
              id="email"
              label="Email Address"
              type="email"
              value={userEmail || ''}
              readOnly
              description="Email cannot be changed directly. Contact support if needed."
              className="bg-muted"
            />

            <SettingInput
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              value={profileForm.phone_number}
              onChange={(value) => setProfileForm(prev => ({ ...prev, phone_number: value }))}
              description="Optional - used for account recovery and notifications"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full sm:w-auto"
            >
              {savingProfile ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </SettingCard>

        {/* Change Password */}
        <SettingCard
          title="Security"
          description="Update your password to keep your account secure"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="pr-10"
                  data-testid="input-current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <SettingInput
              id="new-password"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, newPassword: value }))}
              description="Must be at least 6 characters long"
            />

            <SettingInput
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, confirmPassword: value }))}
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {savingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </SettingCard>
      </div>
    </div>
  )
}