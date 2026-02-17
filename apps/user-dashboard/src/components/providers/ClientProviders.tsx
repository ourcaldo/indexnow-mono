'use client'

import { BaseProviders } from '@indexnow/ui'
import { PaddleProvider } from '@indexnow/ui/providers'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      {children}
    </BaseProviders>
  )
}
