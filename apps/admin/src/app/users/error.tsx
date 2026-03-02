'use client';

import { useEffect } from 'react';

export default function UsersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Users page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">Failed to load users</p>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
