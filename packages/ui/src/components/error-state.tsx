'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';

interface ErrorStateProps {
  /**
   * Error title displayed prominently
   */
  title?: string;

  /**
   * Detailed error message
   */
  message?: string;

  /**
   * Optional error ID for tracking/support
   */
  errorId?: string;

  /**
   * Callback function when user clicks retry button
   */
  onRetry?: () => void;

  /**
   * Show home button to navigate back
   */
  showHomeButton?: boolean;

  /**
   * Custom retry button label
   */
  retryLabel?: string;

  /**
   * Display variant - 'card' for full card layout, 'inline' for compact display
   */
  variant?: 'card' | 'inline';
}

/**
 * ErrorState Component
 *
 * Standardized error display component for consistent error UX across the application.
 * Supports both full-page card layout and inline compact display.
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  errorId,
  onRetry,
  showHomeButton = false,
  retryLabel = 'Try Again',
  variant = 'card',
}: ErrorStateProps) {
  const router = useRouter();

  const handleCopyErrorId = () => {
    if (errorId && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(errorId)
        .then(() => {
          // Visual feedback could be added here
        })
        .catch(() => {
          console.warn('Failed to copy error ID to clipboard');
        });
    }
  };

  // Inline variant - compact display
  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className="my-4" data-testid="error-state-inline">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2 flex-1">
          <div className="flex items-center justify-between">
            <span data-testid="error-message">{message}</span>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="ml-4"
                data-testid="button-retry"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                {retryLabel}
              </Button>
            )}
          </div>
          {errorId && (
            <button
              onClick={handleCopyErrorId}
              className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer text-xs underline"
              data-testid="button-copy-error-id"
            >
              Error ID: {errorId} (click to copy)
            </button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant - full page display
  return (
    <div
      className="flex min-h-[400px] items-center justify-center p-4"
      data-testid="error-state-card"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-6 w-6" data-testid="icon-error" />
          </div>
          <CardTitle className="text-xl" data-testid="error-title">
            {title}
          </CardTitle>
          <CardDescription className="mt-2" data-testid="error-message">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error ID display */}
          {errorId && (
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="text-muted-foreground text-sm">Error ID</p>
              <button
                onClick={handleCopyErrorId}
                className="text-foreground hover:text-primary cursor-pointer font-mono text-sm underline"
                data-testid="button-copy-error-id"
                title="Click to copy error ID"
              >
                {errorId}
              </button>
              <p className="text-muted-foreground mt-1 text-xs">Click to copy</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="default"
                className="w-full sm:w-auto"
                data-testid="button-retry"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {retryLabel}
              </Button>
            )}

            {showHomeButton && (
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full sm:w-auto"
                data-testid="button-home"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}
          </div>

          {/* Help text */}
          <p className="text-muted-foreground text-center text-xs">
            If this problem persists, please contact support
            {errorId && ' with the error ID above'}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
