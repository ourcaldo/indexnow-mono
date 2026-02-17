'use client'

import { BaseProviders } from '@indexnow/ui'

export function AdminClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BaseProviders>
      {children}
    </BaseProviders>
  )
}
