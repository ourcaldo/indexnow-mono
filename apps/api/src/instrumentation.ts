import { logger } from '@/lib/monitoring/error-handling'
import { setLoggerTransport, type LoggerTransport } from '@indexnow/shared'

// E-01: Route shared-package logs through pino for unified structured logging
setLoggerTransport(logger as unknown as LoggerTransport)

export async function register() {
  // Initialize Sentry for server-side error tracking (Node.js + Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const { initializeServerSentry } = await import('@indexnow/analytics')
    initializeServerSentry()
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Global error handlers for uncaught exceptions and unhandled rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error(
        { error: reason instanceof Error ? reason.message : String(reason) },
        'Unhandled promise rejection'
      )
    })

    process.on('uncaughtException', (error: Error) => {
      logger.error(
        { error: error.message, stack: error.stack },
        'Uncaught exception'
      )
      // Allow process to exit after logging
      process.exit(1)
    })

    // ── Graceful shutdown on SIGTERM / SIGINT ──
    const gracefulShutdown = async (signal: string) => {
      logger.info({}, `Received ${signal} — starting graceful shutdown`)

      try {
        // 1. Shut down BullMQ queues & workers
        const { queueManager } = await import('@/lib/queues/QueueManager')
        await queueManager.shutdown()
        logger.info({}, 'BullMQ queues and workers shut down')
      } catch (err) {
        logger.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Error shutting down queues'
        )
      }

      try {
        // 2. Disconnect Redis cache
        const { cacheService } = await import('@/lib/cache/redis-cache')
        await cacheService.disconnect()
        logger.info({}, 'Redis cache disconnected')
      } catch (err) {
        logger.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Error disconnecting Redis cache'
        )
      }

      logger.info({}, 'Graceful shutdown complete')
      process.exit(0)
    }

    process.on('SIGTERM', () => { gracefulShutdown('SIGTERM') })
    process.on('SIGINT', () => { gracefulShutdown('SIGINT') })

    try {
      // Import dynamically to avoid loading BullMQ in non-Node environments (like Edge)
      // although we checked runtime, it's safer.
      const { initializeAllWorkers } = await import('@/lib/queues/workers')
      
      // Initialize workers
      // We don't await this to prevent blocking server startup
      // The workers will initialize in the background
      initializeAllWorkers().catch(error => {
        logger.error({ error }, 'Failed to initialize workers asynchronously')
      })
      
      logger.info({}, 'Instrumentation: Worker initialization triggered')
    } catch (error) {
      logger.error({ error }, 'Failed to load worker module during startup')
    }
  }
}
