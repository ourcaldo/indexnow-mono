'use client';

import { useState } from 'react';
import { Eye, CheckCircle, RotateCcw } from 'lucide-react';

interface SentryInfo {
  eventId?: string;
  issueId?: string;
  url?: string;
  siblingCount?: number;
  configured?: boolean;
}

interface ErrorResolveActionsProps {
  sentry?: SentryInfo;
  isPending: boolean;
  isResolved?: boolean;
  isAcknowledged?: boolean;
  onAction: (action: 'acknowledge' | 'resolve' | 'unresolve') => void;
}

/**
 * Shared Acknowledge + Resolve buttons with sibling-group confirmation.
 * Used by both the ErrorSlideOver and the ErrorDetailPage.
 *
 * When resolved → shows "Unresolve" button only (reopens in Sentry too).
 * When unresolved → shows Acknowledge + Resolve buttons as before.
 */
export function ErrorResolveActions({ sentry, isPending, isResolved, isAcknowledged, onAction }: ErrorResolveActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Already resolved → show Unresolve button
  if (isResolved) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => onAction('unresolve')}
          disabled={isPending}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-40 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Unresolve
        </button>
      </div>
    );
  }

  const handleResolve = () => {
    if (sentry?.siblingCount && sentry.siblingCount > 0) {
      setShowConfirm(true);
    } else {
      onAction('resolve');
    }
  };

  const confirmResolve = () => {
    setShowConfirm(false);
    onAction('resolve');
  };

  return (
    <div className="space-y-2">
      {!isAcknowledged && (
        <button
          onClick={() => onAction('acknowledge')}
          disabled={isPending}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
        >
          <Eye className="w-4 h-4" /> Acknowledge
        </button>
      )}

      {showConfirm ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-xs text-amber-800">
            This will also resolve{' '}
            <span className="font-semibold">
              {sentry?.siblingCount} related error{(sentry?.siblingCount ?? 0) > 1 ? 's' : ''}
            </span>{' '}
            grouped under the same Sentry issue and mark the issue as resolved in Sentry.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={confirmResolve}
              disabled={isPending}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Resolve All
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleResolve}
          disabled={isPending}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {sentry?.siblingCount && sentry.siblingCount > 0
            ? `Mark Resolved (+ ${sentry.siblingCount} related)`
            : 'Mark Resolved'}
        </button>
      )}
    </div>
  );
}
