import { useToast } from '@indexnow/ui'
import { logger } from '../../utils/logger'

interface ApiErrorOptions {
  showToast?: boolean
  toastTitle?: string
  logToConsole?: boolean
  context?: string
}

/**
 * Hook for handling API errors consistently across the application
 */
export function useApiError() {
  const { toast } = useToast()

  const handleApiError = (error: unknown, options: ApiErrorOptions = {}) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      logToConsole = true,
      context = 'API'
    } = options

    const message = error instanceof Error ? error.message : 'An unexpected error occurred'

    // Log the error using the global logger
    if (logToConsole) {
      logger.error({ 
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        context 
      }, message)
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: toastTitle,
        description: message,
        variant: 'destructive',
      })
    }

    return message
  }

  return { handleApiError }
}
