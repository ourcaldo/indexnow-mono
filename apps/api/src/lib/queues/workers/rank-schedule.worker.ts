/**
 * Rank Schedule Worker
 * Daily cron job that queues rank-check jobs for every active keyword that
 * hasn't been checked in the last 23 hours (or never checked).
 *
 * Schedule: 02:00 UTC every day ('0 2 * * *')
 */

import { Job } from 'bullmq'
import { queueManager, enqueueJob } from '../QueueManager'
import { queueConfig } from '../config'
import { logger } from '@/lib/monitoring/error-handling'
import { supabaseAdmin } from '@indexnow/database'

async function processRankSchedule(job: Job): Promise<{ queued: number }> {
  logger.info({ jobId: job.id }, 'Processing daily rank schedule')

  // Fetch all active keywords not checked in the last 23 hours (or never checked)
  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  const { data: keywords, error } = await supabaseAdmin
    .from('indb_rank_keywords')
    .select('id, user_id')
    .or(`last_checked.is.null,last_checked.lt.${cutoff}`)
    .order('last_checked', { ascending: true, nullsFirst: true })

  if (error) {
    logger.error({ error: error.message }, 'Rank schedule: failed to fetch keywords')
    throw error
  }

  const toCheck = keywords ?? []
  logger.info({ count: toCheck.length }, 'Rank schedule: queuing rank checks')

  let queued = 0
  for (const kw of toCheck) {
    try {
      await enqueueJob(
        queueConfig.rankCheck.name,
        'scheduled-rank-check',
        { keywordId: kw.id, userId: kw.user_id }
      )
      queued++
    } catch (err) {
      logger.warn(
        { keywordId: kw.id, error: err instanceof Error ? err.message : String(err) },
        'Rank schedule: failed to enqueue rank check for keyword'
      )
    }
  }

  logger.info({ queued, total: toCheck.length }, 'Rank schedule complete')
  return { queued }
}

export async function initializeRankScheduleWorker(): Promise<void> {
  const queueName = queueConfig.rankSchedule.name

  await queueManager.registerWorker(queueName, processRankSchedule, {
    concurrency: queueConfig.rankSchedule.concurrency,
  })

  const queue = await queueManager.getQueue(queueName)

  // Avoid registering a duplicate repeatable job on restart
  const existingJobs = await queue.getRepeatableJobs()
  const jobId = 'daily-rank-schedule'
  const alreadyExists = existingJobs.some(j => j.name === jobId)

  if (alreadyExists) {
    logger.info({ queue: queueName, jobId }, 'Rank schedule: repeatable job already registered, skipping')
    return
  }

  await queue.add(
    jobId,
    {},
    {
      jobId,
      repeat: {
        // Every day at 02:00 UTC
        pattern: '0 2 * * *',
      },
    }
  )

  logger.info({ queue: queueName, schedule: '0 2 * * *' }, 'Rank schedule worker initialized')
}
