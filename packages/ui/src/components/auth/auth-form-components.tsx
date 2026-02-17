'use client'

import React, { useState } from 'react'
import { Input } from '../input'
import { Label } from '../label'
import { Button } from '../button'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * Shared auth form sub-components — issue #151
 * 
 * These are composable building blocks for auth pages. Both the admin and
 * user-dashboard login pages use different layouts and logic, so we extract
 * the shared UI primitives rather than creating a monolithic LoginForm.
 */

// ─── Password Input with Toggle ─────────────────────────────────────────────

export interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  label?: string
  className?: string
  /** Use the native HTML input styling (for user-dashboard) vs shadcn Input (for admin) */
  variant?: 'shadcn' | 'native'
}

/**
 * Password input field with show/hide toggle button.
 * Used by both admin and user-dashboard login pages.
 */
export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter your password',
  disabled = false,
  id = 'password',
  label = 'Password',
  className,
  variant = 'shadcn',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  if (variant === 'native') {
    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-field-default form-field-focus w-full px-4 py-3 pr-12 text-base"
            placeholder={placeholder}
            required
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-muted-foreground cursor-pointer text-sm p-1 flex items-center justify-center hover:text-foreground transition-colors"
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="text-foreground font-medium">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-border focus:border-accent focus:ring-accent pr-10"
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Auth Error Alert ────────────────────────────────────────────────────────

export interface AuthErrorAlertProps {
  error: string | null
  className?: string
  /** Treat messages starting with "SUCCESS:" as success alerts */
  allowSuccessPrefix?: boolean
}

/**
 * Error/success alert for auth forms.
 * Renders nothing when error is null.
 */
export function AuthErrorAlert({ error, className, allowSuccessPrefix = false }: AuthErrorAlertProps) {
  if (!error) return null

  const isSuccess = allowSuccessPrefix && error.startsWith('SUCCESS:')
  const displayMessage = isSuccess ? error.replace('SUCCESS: ', '') : error

  // Transform common Supabase error messages to user-friendly versions
  const friendlyMessage = displayMessage.toLowerCase().includes('email not confirmed')
    ? 'Please verify your email before accessing your account.'
    : displayMessage

  if (isSuccess) {
    return (
      <div className={`bg-success/10 text-success border border-success/20 p-3 text-center rounded-lg ${className ?? ''}`}>
        {friendlyMessage}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive rounded-md ${className ?? ''}`}>
      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive">{friendlyMessage}</p>
    </div>
  )
}

// ─── Auth Loading Button ─────────────────────────────────────────────────────

export interface AuthLoadingButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
  /** Use the native HTML button styling (for user-dashboard) vs shadcn Button (for admin) */
  variant?: 'shadcn' | 'native'
}

/**
 * Submit button with loading spinner state for auth forms.
 */
export function AuthLoadingButton({
  isLoading,
  loadingText = 'Signing in...',
  children,
  className,
  disabled = false,
  type = 'submit',
  onClick,
  variant = 'shadcn',
}: AuthLoadingButtonProps) {
  if (variant === 'native') {
    return (
      <button
        type={type}
        disabled={isLoading || disabled}
        onClick={onClick}
        className={`w-full py-[14px] px-6 bg-brand-primary text-white border-0 rounded-lg text-base font-semibold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors flex items-center justify-center ${className ?? ''}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }

  return (
    <Button
      type={type}
      className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 ${className ?? ''}`}
      disabled={isLoading || disabled}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  )
}

// ─── Auth Checking Spinner ───────────────────────────────────────────────────

export interface AuthCheckingSpinnerProps {
  message?: string
}

/**
 * Full-screen loading spinner shown while checking existing auth state.
 */
export function AuthCheckingSpinner({ message = 'Loading...' }: AuthCheckingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}
