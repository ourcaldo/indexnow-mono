'use client'

import React from 'react'
import { AuthProvider } from '@indexnow/auth'
import { AnalyticsProvider } from '../providers/AnalyticsProvider'
import { QueryProvider } from './query-provider'
import { ToastContainer } from './toast'
import { FaviconProvider } from './favicon-provider'

interface BaseProvidersProps {
  children: React.ReactNode
  /**
   * Additional providers to wrap around the core stack.
   * Rendered between AnalyticsProvider and QueryProvider.
   * Example: PaddleProvider for user-dashboard.
   */
  outerProviders?: React.ComponentType<{ children: React.ReactNode }>[]
  /** Whether to include FaviconProvider (default: true) */
  includeFavicon?: boolean
}

/**
 * Shared provider stack for all apps.
 * Wraps: AnalyticsProvider > [outerProviders] > QueryProvider > AuthProvider > ToastContainer > [FaviconProvider]
 *
 * Usage in admin:
 *   <BaseProviders>{children}</BaseProviders>
 *
 * Usage in user-dashboard:
 *   <BaseProviders outerProviders={[PaddleProvider]}>{children}</BaseProviders>
 */
export function BaseProviders({
  children,
  outerProviders = [],
  includeFavicon = true,
}: BaseProvidersProps) {
  // Build the inner core: QueryProvider > AuthProvider > ToastContainer > children
  let content = (
    <QueryProvider>
      <AuthProvider>
        <ToastContainer>
          {includeFavicon && <FaviconProvider />}
          {children}
        </ToastContainer>
      </AuthProvider>
    </QueryProvider>
  )

  // Wrap outer providers in reverse order (last in array = innermost)
  for (let i = outerProviders.length - 1; i >= 0; i--) {
    const Provider = outerProviders[i]
    content = <Provider>{content}</Provider>
  }

  return (
    <AnalyticsProvider>
      {content}
    </AnalyticsProvider>
  )
}
