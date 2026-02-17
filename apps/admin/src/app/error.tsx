'use client'

import { useEffect } from 'react'
import { Button } from '@indexnow/ui'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'
import { errorTracker } from '@indexnow/analytics'
import { logger } from '@indexnow/shared'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our tracking system
    logger.error({ error: error instanceof Error ? error : undefined }, 'Admin Application Error')
    
    // We can't use keywordId here as it's a general app error
    errorTracker.logError({
      keywordId: 'app_error',
      userId: 'system',
      errorType: 'api_error',
      errorMessage: error.message || 'Unknown application error',
      timestamp: new Date(),
      severity: 'high',
      context: {
        digest: error.digest,
        stack: error.stack,
        url: window.location.href
      }
    }).catch((err) => logger.error({ error: err instanceof Error ? err : undefined }, 'Caught error'))
  }, [error])

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong!</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred in the admin dashboard. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto border-border text-muted-foreground hover:bg-secondary"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            If the problem persists, please contact the system administrator or check the server logs.
          </p>
        </div>
      </div>
    </div>
  )
}

