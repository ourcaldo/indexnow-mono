import { Job } from 'bullmq'
import { queueManager } from '../QueueManager'
import { queueConfig } from '../config'
import { ImmediateRankCheckJob, ImmediateRankCheckJobSchema } from '../types'
import { RankTracker } from '@/lib/rank-tracking/rank-tracker'
import { logger } from '@/lib/monitoring/error-handling'
import { supabaseAdmin } from '@indexnow/database'

async function processRankCheck(job: Job<ImmediateRankCheckJob>): Promise<{
  success: boolean
  rank?: number
  error?: string
}> {
  const { keywordId, userId } = job.data

  logger.info({ jobId: job.id, keywordId, userId }, 'Processing rank check job')

  try {
    const validatedData = ImmediateRankCheckJobSchema.parse(job.data)

    // 1. Get keyword details
    const { data: keyword, error: keywordError } = await supabaseAdmin
      .from('indb_rank_keywords')
      .select('*')
      .eq('id', keywordId)
      .single()

    if (keywordError || !keyword) {
      throw new Error('Keyword not found or not accessible')
    }

    // 2. Check rank using Firecrawl (RankTracker class)
    const result = await RankTracker.checkRank(
      keyword.keyword,
      keyword.domain,
      keyword.country,
      keyword.device
    )

    // 3. Update DB
    // Update keyword position
    await supabaseAdmin
      .from('indb_rank_keywords')
      .update({
        position: result.position,
        previous_position: keyword.position, // Move current to previous
        last_checked: new Date().toISOString()
      })
      .eq('id', keywordId)

    // Insert history
    await supabaseAdmin
      .from('indb_keyword_rank_history')
      .insert({
        keyword_id: keywordId,
        position: result.position,
        checked_at: new Date().toISOString(),
        metadata: {
           searchResults: result.searchResults,
           url: result.url,
           title: result.title
        }
      })

    logger.info({ jobId: job.id, keywordId, rank: result.position }, 'Rank check completed successfully')

    return { success: true, rank: result.position }
  } catch (error) {
    logger.error(
      { jobId: job.id, keywordId, error: error instanceof Error ? error.message : 'Unknown error' },
      'Rank check failed'
    )

    throw error
  }
}

export function initializeRankCheckWorker(): void {
  const { concurrency, limiter } = queueConfig.rankCheck

  queueManager.registerWorker(
    queueConfig.rankCheck.name,
    processRankCheck,
    { concurrency, limiter }
  )

  logger.info(
    { queue: queueConfig.rankCheck.name, concurrency, limiter },
    'Rank check worker initialized'
  )
}
