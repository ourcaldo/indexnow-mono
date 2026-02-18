'use client';

import { useToast } from '../components/toast';
import type { ApiError } from '@indexnow/shared';

// Type guard for ApiError interface
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'statusCode' in error
  );
}

/**
 * Hook for consistent API error handling with toast notifications
 *
 * Integrates with standardized ApiResponse format from Phase 2 error handling
 * Automatically extracts error details (message, ID, severity) and displays
 * user-friendly toast notifications with optional error ID copying.
 */
export interface HandleApiErrorOptions {
  context?: string;
  toastTitle?: string;
}

export interface UseApiErrorReturn {
  handleApiError: (error: unknown, options?: HandleApiErrorOptions) => void;
}

export function useApiError(): UseApiErrorReturn {
  const { addToast } = useToast();

  /**
   * Handle API errors with toast notifications
   */
  const handleApiError = (error: unknown, options?: HandleApiErrorOptions) => {
    // Extract error details from different error types
    let message = 'An unexpected error occurred';
    let errorId: string | undefined;
    let severity: string | undefined;

    if (isApiError(error)) {
      message = error.message;
      errorId = error.code;
      severity = undefined;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Determine toast variant based on severity
    const toastType = severity === 'CRITICAL' || severity === 'HIGH' ? 'error' : 'error';

    // Show error toast
    addToast({
      title: options?.toastTitle || 'Error',
      description: message,
      type: toastType,
      duration: 6000,
      ...(errorId && {
        action: {
          label: 'Copy Error ID',
          onClick: () => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard
                .writeText(errorId)
                .then(() => {
                  addToast({
                    title: 'Error ID copied',
                    description: 'Error ID has been copied to clipboard',
                    type: 'success',
                    duration: 3000,
                  });
                })
                .catch(() => {});
            }
          },
        },
      }),
    });
  };

  return { handleApiError };
}
