'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to structured logger in production — no stack traces to client
    console.error('[API Error Boundary]', error.digest ?? 'unknown')
  }, [error])

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h2>Something went wrong</h2>
      <p>An unexpected error occurred. Please try again.</p>
      <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}
