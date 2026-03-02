'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
    logger.error({ error: error instanceof Error ? error : undefined }, 'Admin Application Error');
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
        <p className="text-sm text-gray-400">
          An error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-600 font-mono">ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-gray-400 border border-white/[0.08] rounded-md hover:text-gray-200 hover:bg-white/[0.04] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
