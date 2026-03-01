'use client'

import { Suspense } from 'react'
import { BaseProviders } from '@indexnow/ui'
import { PaddleProvider } from '@indexnow/ui/providers'
import { DashboardLayoutWrapper } from '../layout/DashboardLayoutWrapper'
import { WorkspaceProvider } from './WorkspaceProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      {/* Suspense required because WorkspaceProvider uses useSearchParams() */}
      <Suspense fallback={null}>
        <WorkspaceProvider>
          <DashboardLayoutWrapper>
            {children}
          </DashboardLayoutWrapper>
        </WorkspaceProvider>
      </Suspense>
    </BaseProviders>
  )
}
