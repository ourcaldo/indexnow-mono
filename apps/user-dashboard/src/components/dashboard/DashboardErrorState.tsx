'use client';

import { ErrorState } from '@indexnow/ui';

export interface DashboardErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <ErrorState
      title="Failed to Load Dashboard Data"
      message={message || 'We encountered an error while loading your dashboard. Please try again.'}
      onRetry={onRetry}
      retryLabel="Retry Loading"
      variant="inline"
    />
  );
}
