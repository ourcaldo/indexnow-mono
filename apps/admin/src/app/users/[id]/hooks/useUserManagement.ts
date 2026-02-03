'use client'

import { useState, useCallback } from 'react'
import { ADMIN_ENDPOINTS } from '@indexnow/shared'
import { useNotification } from '@indexnow/ui'

interface UserActions {
  suspend: boolean
  resetPassword: boolean
  editData: boolean
  resetQuota: boolean
  changePackage: boolean
  extendSubscription: boolean
}

interface EditForm {
  full_name: string
  role: string
  email_notifications: boolean
  phone_number: string
}

interface ConfirmConfig {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  confirmText?: string
  variant?: 'destructive' | 'primary'
}

interface UseUserManagementReturn {
  actionLoading: UserActions
  newPassword: string
  showPassword: boolean
  editMode: boolean
  editForm: EditForm
  showPackageModal: boolean
  selectedPackageId: string
  confirmConfig: ConfirmConfig
  setEditMode: (value: boolean) => void
  setEditForm: (value: EditForm) => void
  setShowPackageModal: (value: boolean) => void
  setSelectedPackageId: (value: string) => void
  setConfirmConfig: (value: ConfirmConfig) => void
  handleSuspendUser: (userId: string, onSuccess: () => void) => Promise<void>
  handleResetPassword: (userId: string) => Promise<void>
  handleResetQuota: (userId: string, onSuccess: () => void) => Promise<void>
  handleChangePackage: () => void
  handleExtendSubscription: (userId: string, onSuccess: () => void) => Promise<void>
  handleSaveEdit: (userId: string, editForm: EditForm, onSuccess: () => void) => Promise<void>
  handlePackageChangeSubmit: (userId: string, selectedPackageId: string, onSuccess: () => void) => Promise<void>
  handleEditFormChange: (updates: Partial<EditForm>) => void
  handleTogglePasswordVisibility: () => void
}

export function useUserManagement(): UseUserManagementReturn {
  const { showSuccess, showError } = useNotification()
  const [actionLoading, setActionLoading] = useState<UserActions>({
    suspend: false,
    resetPassword: false,
    editData: false,
    resetQuota: false,
    changePackage: false,
    extendSubscription: false,
  })
  
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '',
    role: '',
    email_notifications: false,
    phone_number: ''
  })
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const handleSuspendUser = useCallback(async (userId: string, onSuccess: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Suspend User',
      message: 'Are you sure you want to suspend this user? They will lose access to their account.',
      variant: 'destructive',
      confirmText: 'Suspend',
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, suspend: true }))
          
          const response = await fetch(ADMIN_ENDPOINTS.SUSPEND_USER(userId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            onSuccess()
            showSuccess('User Suspended', 'User has been suspended successfully.')
          } else {
            showError('Action Failed', 'Failed to suspend user. Please try again.')
          }
        } catch (error) {
          console.error('Failed to suspend user:', error)
          showError('System Error', 'An error occurred while suspending user.')
        } finally {
          setActionLoading(prev => ({ ...prev, suspend: false }))
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }, [showSuccess, showError])

  const handleResetPassword = useCallback(async (userId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Password',
      message: 'Are you sure you want to reset this user\'s password? They will receive a password reset email.',
      confirmText: 'Reset',
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, resetPassword: true }))
          
          const response = await fetch(ADMIN_ENDPOINTS.RESET_USER_PASSWORD(userId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            setNewPassword(data.temporaryPassword || '')
            showSuccess('Password Reset', 'Password reset successfully. Temporary password generated.')
          } else {
            showError('Action Failed', 'Failed to reset password. Please try again.')
          }
        } catch (error) {
          console.error('Failed to reset password:', error)
          showError('System Error', 'An error occurred while resetting password.')
        } finally {
          setActionLoading(prev => ({ ...prev, resetPassword: false }))
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }, [showSuccess, showError])

  const handleResetQuota = useCallback(async (userId: string, onSuccess: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Quota',
      message: 'Are you sure you want to reset this user\'s daily quota? This will reset their usage to 0.',
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, resetQuota: true }))
          
          const response = await fetch(ADMIN_ENDPOINTS.RESET_USER_QUOTA(userId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            onSuccess()
            showSuccess('Quota Reset', 'User quota has been successfully reset.')
          } else {
            showError('Action Failed', 'Failed to reset quota. Please try again.')
          }
        } catch (error) {
          console.error('Failed to reset quota:', error)
          showError('System Error', 'An error occurred while resetting quota.')
        } finally {
          setActionLoading(prev => ({ ...prev, resetQuota: false }))
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }, [showSuccess, showError])

  const handleChangePackage = useCallback(() => {
    setShowPackageModal(true)
  }, [])

  const handleExtendSubscription = useCallback(async (userId: string, onSuccess: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Extend Subscription',
      message: 'Are you sure you want to extend this user\'s subscription by 30 days?',
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, extendSubscription: true }))
          
          const response = await fetch(ADMIN_ENDPOINTS.EXTEND_SUBSCRIPTION(userId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ days: 30 }),
          })

          if (response.ok) {
            onSuccess()
            showSuccess('Subscription Extended', 'Subscription has been extended by 30 days.')
          } else {
            showError('Action Failed', 'Failed to extend subscription. Please try again.')
          }
        } catch (error) {
          console.error('Failed to extend subscription:', error)
          showError('System Error', 'An error occurred while extending subscription.')
        } finally {
          setActionLoading(prev => ({ ...prev, extendSubscription: false }))
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }, [showSuccess, showError])

  const handleSaveEdit = useCallback(async (userId: string, editForm: EditForm, onSuccess: () => void) => {
    try {
      setActionLoading(prev => ({ ...prev, editData: true }))

      const response = await fetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        onSuccess()
        setEditMode(false)
        showSuccess('User Updated', 'User profile has been updated successfully.')
      } else {
        showError('Update Failed', 'Failed to update user. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      showError('System Error', 'An error occurred while updating user.')
    } finally {
      setActionLoading(prev => ({ ...prev, editData: false }))
    }
  }, [showSuccess, showError])

  const handlePackageChangeSubmit = useCallback(async (userId: string, selectedPackageId: string, onSuccess: () => void) => {
    if (!selectedPackageId) {
      showError('Selection Required', 'Please select a package first.')
      return
    }

    try {
      setActionLoading(prev => ({ ...prev, changePackage: true }))
      
      const response = await fetch(ADMIN_ENDPOINTS.CHANGE_PACKAGE(userId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ packageId: selectedPackageId }),
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess()
        setShowPackageModal(false)
        showSuccess('Package Changed', data.message || 'Package changed successfully!')
      } else {
        const errorData = await response.json()
        showError('Action Failed', errorData.error || 'Failed to change package. Please try again.')
      }
    } catch (error) {
      console.error('Failed to change package:', error)
      showError('System Error', 'An error occurred while changing package.')
    } finally {
      setActionLoading(prev => ({ ...prev, changePackage: false }))
    }
  }, [showSuccess, showError])

  const handleEditFormChange = useCallback((updates: Partial<EditForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [])

  const handleTogglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  return {
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
    handleTogglePasswordVisibility
  }
}