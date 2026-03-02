'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@indexnow/shared';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error({ error: error instanceof Error ? error : undefined }, 'Admin Application Error');
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500">An error occurred. Our team has been notified.</p>
        {error.digest && <p className="text-xs text-gray-400 font-mono">ID: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">Try again</button>
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
