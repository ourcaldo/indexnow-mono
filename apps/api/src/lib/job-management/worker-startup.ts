/**
 * Worker Startup stub
 * TODO: Implement worker startup logic
 *
 * ⚠ (#V7 H-22): This is a stub — BullMQ workers will NOT process jobs until implemented.
 * If ENABLE_BULLMQ=true and WORKER_MODE=true in production, jobs will be enqueued but
 * never processed. Implement initialize() to register BullMQ workers before enabling.
 */

import { logger } from '@indexnow/shared';

export class WorkerStartup {
  static async initialize(): Promise<void> {
    if (process.env.ENABLE_BULLMQ === 'true' && process.env.WORKER_MODE === 'true') {
      logger.warn(
        {},
        '[WorkerStartup] ENABLE_BULLMQ and WORKER_MODE are set but worker startup is a stub. Jobs will NOT be processed.'
      );
    }
    // Stub: no-op
  }
}
