'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Client-side query client provider
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance that won't be recreated on re-renders
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time of 5 minutes - data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time of 10 minutes - data stays in cache for 10 minutes after being unused
        gcTime: 10 * 60 * 1000, 
        // (#146) Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Refetch on reconnect to restore fresh data after network recovery
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry failed mutations once (mutations should not retry aggressively)
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
