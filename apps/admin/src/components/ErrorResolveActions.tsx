'use client';

import { useState } from 'react';
import { Eye, CheckCircle, RotateCcw } from 'lucide-react';
import type { ErrorDetailSentry } from '@indexnow/shared';

interface ErrorResolveActionsProps {
  sentry?: ErrorDetailSentry | null;
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
export function ErrorResolveActions({
  sentry,
  isPending,
  isResolved,
  isAcknowledged,
  onAction,
}: ErrorResolveActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Already resolved → show Unresolve button
  if (isResolved) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => onAction('unresolve')}
          disabled={isPending}
          className="flex w-full items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" /> Unresolve
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
          className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-40"
        >
          <Eye className="h-4 w-4" /> Acknowledge
        </button>
      )}

      {showConfirm ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
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
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
            >
              Resolve All
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleResolve}
          disabled={isPending}
          className="flex w-full items-center gap-2.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          <CheckCircle className="h-4 w-4" />
          {sentry?.siblingCount && sentry.siblingCount > 0
            ? `Mark Resolved (+ ${sentry.siblingCount} related)`
            : 'Mark Resolved'}
        </button>
      )}
    </div>
  );
}
