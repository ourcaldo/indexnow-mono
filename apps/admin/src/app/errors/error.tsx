'use client';

// (#V7 M-35) Error boundary for the /errors (Error Monitoring) route.
// Prevents the admin root error.tsx from catching errors in this sub-route,
// allowing a more contextual UI and recovery option.

import { useEffect } from 'react';
import { Button } from '@indexnow/ui';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { logger } from '@indexnow/shared';

export default function ErrorMonitoringError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(
      { error: error instanceof Error ? error : undefined },
      'Error Monitoring page crashed'
    );
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <AlertCircle className="text-destructive mx-auto h-10 w-10" />
        <h2 className="text-foreground text-xl font-semibold">Failed to load Error Monitoring</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || 'An unexpected error occurred while loading the error dashboard.'}
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">Error ID: {error.digest}</p>
        )}
        <Button onClick={() => reset()} className="bg-primary text-primary-foreground">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
