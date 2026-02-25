'use client'

import { BaseProviders } from '@indexnow/ui'
import { PaddleProvider } from '@indexnow/ui/providers'
import { DomainProvider } from '@indexnow/ui/contexts'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      <DomainProvider>
        {children}
      </DomainProvider>
    </BaseProviders>
  )
}
