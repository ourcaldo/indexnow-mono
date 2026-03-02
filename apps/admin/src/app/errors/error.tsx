'use client';

import { useEffect } from 'react';

export default function ErrorsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Errors page error:', error); }, [error]);
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-400">Failed to load error logs</p>
        <button onClick={reset} className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors">Retry</button>
      </div>
    </div>
  );
}
