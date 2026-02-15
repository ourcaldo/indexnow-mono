import { Job } from 'bullmq'
import { queueManager } from '../QueueManager'
import { queueConfig } from '../config'
import { ImmediateRankCheckJob, ImmediateRankCheckJobSchema } from '../types'
import { RankTracker } from '@/lib/rank-tracking/rank-tracker'
import { logger } from '@/lib/monitoring/error-handling'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared'

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
    const keyword = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: userId || 'system',
        operation: 'worker_get_keyword_for_rank_check',
        reason: 'Rank check worker fetching keyword details for rank check job',
        source: 'queues/workers/rank-check.worker',
        metadata: { keywordId, jobId: job.id }
      },
      { table: 'indb_rank_keywords', operationType: 'select' },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_rank_keywords')
          .select('id, keyword, domain, country, device, position')
          .eq('id', keywordId)
          .single()

        if (error || !data) {
          throw ErrorHandlingService.createError({ message: 'Keyword not found or not accessible', type: ErrorType.NOT_FOUND, severity: ErrorSeverity.MEDIUM })
        }

        return data
      }
    )

    // 2. Check rank using Firecrawl (RankTracker class)
    const result = await RankTracker.checkRank(
      keyword.keyword,
      keyword.domain,
      keyword.country,
      keyword.device
    )

    // 3. Update DB — update keyword position + insert ranking history
    await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: userId || 'system',
        operation: 'worker_save_rank_check_result',
        reason: 'Rank check worker saving rank check results to database',
        source: 'queues/workers/rank-check.worker',
        metadata: { keywordId, jobId: job.id, position: result.position }
      },
      { table: 'indb_rank_keywords', operationType: 'update' },
      async () => {
        // Update keyword position
        const { error: updateError } = await supabaseAdmin
          .from('indb_rank_keywords')
          .update({
            position: result.position,
            previous_position: keyword.position,
            last_checked: new Date().toISOString()
          })
          .eq('id', keywordId)

        if (updateError) throw ErrorHandlingService.createError({ message: `Failed to update keyword position: ${updateError.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH })

        // Insert ranking history
        const { error: insertError } = await supabaseAdmin
          .from('indb_keyword_rankings')
          .insert({
            keyword_id: keywordId,
            position: result.position,
            url: result.url,
            check_date: new Date().toISOString().split('T')[0],
            device_type: keyword.device,
            metadata: result
          })

        if (insertError) throw ErrorHandlingService.createError({ message: `Failed to insert ranking history: ${insertError.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH })

        return null
      }
    )

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



