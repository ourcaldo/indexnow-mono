'use client'

import { BaseProviders, PaddleProvider } from '@indexnow/ui'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders outerProviders={[PaddleProvider]}>
      {children}
    </BaseProviders>
  )
}
