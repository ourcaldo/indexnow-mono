'use client'

import { AuthProvider } from '@indexnow/auth'
import { PaddleProvider, AnalyticsProvider } from '@indexnow/shared'
import { Toaster, QueryProvider } from '@indexnow/ui'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider>
      <PaddleProvider>
        <QueryProvider>
          <AuthProvider>
            <Toaster>
              {children}
            </Toaster>
          </AuthProvider>
        </QueryProvider>
      </PaddleProvider>
    </AnalyticsProvider>
  )
}
