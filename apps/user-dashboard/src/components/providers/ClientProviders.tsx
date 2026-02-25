'use client'

import { BaseProviders } from '@indexnow/ui'
import { PaddleProvider } from '@indexnow/ui/providers'
import { DomainProvider } from '@indexnow/ui/contexts'
import { DashboardLayoutWrapper } from '../layout/DashboardLayoutWrapper'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      <DomainProvider>
        <DashboardLayoutWrapper>
          {children}
        </DashboardLayoutWrapper>
      </DomainProvider>
    </BaseProviders>
  )
}
