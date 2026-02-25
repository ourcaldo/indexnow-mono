'use client'

import { BaseProviders } from '@indexnow/ui'
import { PaddleProvider } from '@indexnow/ui/providers'
import { DashboardLayoutWrapper } from '../layout/DashboardLayoutWrapper'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      <DashboardLayoutWrapper>
        {children}
      </DashboardLayoutWrapper>
    </BaseProviders>
  )
}
