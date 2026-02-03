import { logger } from '@/lib/monitoring/error-handling'
import { initializeRankCheckWorker } from './rank-check.worker'
import { initializeEmailWorker } from './email.worker'
import { initializePaymentWorker } from './payments.worker'
import { initializeAutoCancelWorker } from './auto-cancel.worker'
import { initializeKeywordEnrichmentWorker } from './keyword-enrichment.worker'
import { initializeQuotaResetWorker } from './quota-reset.worker'

// Note: The following workers have been removed as they depended on deleted indexing modules:
// - initializeIndexingMonitorWorker (Google indexing no longer supported)
// - initializeDailyRankCheckWorker (rank-schedule.worker.ts - refactored to use cron directly)
// - initializeHourlyRankRetryWorker (hourly-rank-retry.worker.ts - refactored to use cron directly)

export async function initializeAllWorkers(): Promise<void> {
  if (process.env.ENABLE_BULLMQ !== 'true') {
    logger.info({}, 'BullMQ disabled via feature flag - skipping worker initialization')
    return
  }

  try {
    logger.info({}, 'Initializing BullMQ workers...')

    initializeRankCheckWorker()
    initializeEmailWorker()
    initializePaymentWorker()

    await initializeAutoCancelWorker()
    await initializeKeywordEnrichmentWorker()
    await initializeQuotaResetWorker()

    logger.info({}, 'All BullMQ workers initialized successfully')
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Failed to initialize BullMQ workers'
    )
    throw error
  }
}
