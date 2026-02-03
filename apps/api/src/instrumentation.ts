import { logger } from '@/lib/monitoring/error-handling'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
