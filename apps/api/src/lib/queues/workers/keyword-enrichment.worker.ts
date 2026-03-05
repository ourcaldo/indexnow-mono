import { Job } from 'bullmq'
import { queueManager } from '../QueueManager'
import { KeywordEnrichmentJob, KeywordEnrichmentJobSchema } from '../types'
import { logger } from '@/lib/monitoring/error-handling'
import { keywordEnrichmentWorker } from '@/lib/job-management/keyword-enrichment-worker'

async function processKeywordEnrichment(job: Job<KeywordEnrichmentJob>): Promise<{
  processed: boolean
}> {
  const mode = job.data.mode || 'scheduled'
  logger.info({ jobId: job.id, mode }, 'Processing keyword enrichment job')

  try {
    const validatedData = KeywordEnrichmentJobSchema.parse(job.data)
    const worker = await keywordEnrichmentWorker

    switch (validatedData.mode) {
      case 'immediate': {
        if (!validatedData.keywordIds || validatedData.keywordIds.length === 0) {
          logger.warn({ jobId: job.id }, 'Immediate enrichment job has no keywordIds — skipping')
          return { processed: false }
        }
        await worker.enrichByIds(validatedData.keywordIds)
        break
      }
      case 'stale-refresh': {
        await worker.refreshStale()
        break
      }
      case 'scheduled':
      default: {
        await worker.runManually()
        break
      }
    }

    logger.info({ jobId: job.id, mode }, 'Keyword enrichment job completed')
    return { processed: true }
  } catch (error) {
    logger.error(
      { jobId: job.id, mode, error: error instanceof Error ? error.message : 'Unknown error' },
      'Keyword enrichment job failed'
    )
    throw error
  }
}

export async function initializeKeywordEnrichmentWorker(): Promise<void> {
  const queueName = 'keyword-enrichment'

  await queueManager.registerWorker(queueName, processKeywordEnrichment, {
    concurrency: 1,
  })

  const queue = await queueManager.getQueue(queueName)
  const existingJobs = await queue.getRepeatableJobs()

  // ── Hourly new-keyword sweep at :00 ──
  const scheduledJobId = 'keyword-enrichment-check'
  const scheduledPattern = '0 * * * *'
  const existingScheduled = existingJobs.find(j => j.name === scheduledJobId)

  // Remove old job if pattern changed (was '30 * * * *')
  if (existingScheduled && existingScheduled.pattern !== scheduledPattern) {
    await queue.removeRepeatableByKey(existingScheduled.key)
    logger.info({ queue: queueName, oldPattern: existingScheduled.pattern, newPattern: scheduledPattern }, 'Removed old repeatable job with stale pattern')
  }

  if (!existingScheduled || existingScheduled.pattern !== scheduledPattern) {
    await queue.add(
      scheduledJobId,
      { scheduledAt: new Date().toISOString(), mode: 'scheduled' },
      {
        jobId: scheduledJobId,
        repeat: { pattern: scheduledPattern },
      }
    )
    logger.info({ queue: queueName, schedule: scheduledPattern }, 'Keyword enrichment scheduled sweep initialized')
  }

  // ── Daily stale-refresh at 03:00 UTC ──
  const staleJobId = 'keyword-enrichment-stale-refresh'
  const stalePattern = '0 3 * * *'
  const existingStale = existingJobs.find(j => j.name === staleJobId)

  if (!existingStale) {
    await queue.add(
      staleJobId,
      { scheduledAt: new Date().toISOString(), mode: 'stale-refresh' },
      {
        jobId: staleJobId,
        repeat: { pattern: stalePattern },
      }
    )
    logger.info({ queue: queueName, schedule: stalePattern }, 'Keyword enrichment stale-refresh initialized')
  }

  logger.info({ queue: queueName }, 'Keyword enrichment worker fully initialized')
}
