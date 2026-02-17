'use client'

import { useEffect } from 'react'
import { ErrorState } from '@indexnow/ui'
import { logger } from '@indexnow/shared'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error({ error: error instanceof Error ? error : undefined }, 'Analytics page error')
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <ErrorState
        title="Failed to load analytics"
        message={error.message || 'An error occurred while loading analytics data.'}
        errorId={error.digest}
        onRetry={reset}
        showHomeButton
      />
    </div>
  )
}
