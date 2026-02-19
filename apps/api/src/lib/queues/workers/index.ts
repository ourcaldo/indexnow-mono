import { logger } from '@/lib/monitoring/error-handling';
import { initializeRankCheckWorker } from './rank-check.worker';
import { initializeEmailWorker } from './email.worker';
import { initializePaymentWorker } from './payments.worker';
import { initializeAutoCancelWorker } from './auto-cancel.worker';
import { initializeKeywordEnrichmentWorker } from './keyword-enrichment.worker';

export async function initializeAllWorkers(): Promise<void> {
  if (process.env.ENABLE_BULLMQ !== 'true') {
    logger.info({}, 'BullMQ disabled via feature flag - skipping worker initialization');
    return;
  }

  // WORKER_MODE=none means this process should only enqueue jobs, not process them.
  // Use WORKER_MODE=all in a dedicated worker process to handle jobs separately.
  const workerMode = process.env.WORKER_MODE || 'inline';
  if (workerMode === 'none') {
    logger.info({}, 'WORKER_MODE=none — skipping worker initialization (enqueue-only mode)');
    return;
  }

  try {
    logger.info({}, 'Initializing BullMQ workers...');

    initializeRankCheckWorker();
    initializeEmailWorker();
    initializePaymentWorker();

    await initializeAutoCancelWorker();
    await initializeKeywordEnrichmentWorker();

    logger.info({}, 'All BullMQ workers initialized successfully');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Failed to initialize BullMQ workers'
    );
    throw error;
  }
}
