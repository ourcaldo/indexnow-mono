'use client';

import { useEffect } from 'react';
import { Button } from '@indexnow/ui';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { errorTracker } from '@indexnow/analytics';
import { logger } from '@indexnow/shared';
import * as Sentry from '@sentry/nextjs';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our tracking system
    logger.error({ error: error instanceof Error ? error : undefined }, 'Admin Application Error');

    // We can't use keywordId here as it's a general app error
    errorTracker
      .logError({
        keywordId: 'app_error',
        userId: 'system',
        errorType: 'api_error',
        errorMessage: error.message || 'Unknown application error',
        timestamp: new Date(),
        severity: 'high',
        context: {
          digest: error.digest || null,
          // (#V7 M-30) Safe: useEffect only runs client-side where window exists
          url: typeof window !== 'undefined' ? window.location.href : 'ssr',
        },
      })
      .catch((err) =>
        logger.error({ error: err instanceof Error ? err : undefined }, 'Caught error')
      );
  }, [error]);

  return (
    <div className="bg-secondary flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <AlertCircle className="text-destructive h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-bold">Something went wrong!</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred in the admin dashboard. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-muted-foreground mt-2 font-mono text-xs">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary/90 w-full text-white sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>

          <Button
            variant="outline"
            asChild
            className="border-border text-muted-foreground hover:bg-secondary w-full sm:w-auto"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="border-border border-t pt-6">
          <p className="text-muted-foreground text-xs">
            If the problem persists, please contact the system administrator or check the server
            logs.
          </p>
        </div>
      </div>
    </div>
  );
}
