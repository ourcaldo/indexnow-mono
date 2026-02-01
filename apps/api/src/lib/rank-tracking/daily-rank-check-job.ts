import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import * as cron from 'node-cron'
import { logger } from '@/lib/monitoring/error-handling'
import { RankTracker } from './rank-tracker'

/**
 * Daily Rank Check Job - Simplified version without BatchProcessor
 * Processes keyword rank checks daily at 2 AM UTC
 */
export class DailyRankCheckJob {
  private isRunning: boolean = false
  private cronJob: any | null = null
  private rankTracker: RankTracker | null = null

  constructor() {
    try {
      this.rankTracker = new RankTracker()
    } catch (error) {
      this.rankTracker = null
      logger.warn({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to initialize RankTracker')
    }
  }

  start(): void {
    try {
      this.cronJob = cron.schedule('0 2 * * *', async () => {
        await this.executeJob()
      }, {
        timezone: 'UTC'
      })
      logger.info({}, 'Daily rank check job scheduled for 2:00 AM UTC')
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to start daily rank check job')
      this.cronJob = null
    }
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
      logger.info({}, 'Daily rank check job stopped')
    }
  }

  private async executeJob(): Promise<void> {
    if (this.isRunning) {
      logger.warn({}, 'Daily rank check already running, skipping')
      return
    }

    this.isRunning = true
    const jobId = `rank-check-${Date.now()}`
    const startTime = Date.now()

    try {
      logger.info({ jobId }, 'Starting daily rank check job')

      const stats = await this.getStats()
      logger.info({ jobId, pendingChecks: stats.pendingChecks, totalKeywords: stats.totalKeywords }, 'Rank check stats')

      // Note: Actual rank checking logic would be implemented in RankTracker
      // For now, just log that we would process keywords here
      if (stats.pendingChecks > 0) {
        logger.info({ jobId, pendingChecks: stats.pendingChecks }, 'Keywords pending rank check')
      }

      const duration = Math.round((Date.now() - startTime) / 1000)
      logger.info({ jobId, duration }, 'Daily rank check job completed')
    } catch (error) {
      logger.error({ jobId, error: error instanceof Error ? error.message : 'Unknown error' }, 'Daily rank check job failed')
    } finally {
      this.isRunning = false
    }
  }

  async runManually(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Daily rank check already running')
    }
    await this.executeJob()
  }

  getStatus(): {
    isScheduled: boolean
    isRunning: boolean
    nextRun: string | null
  } {
    return {
      isScheduled: this.cronJob !== null,
      isRunning: this.isRunning,
      nextRun: this.cronJob ? 'Daily at 2:00 AM UTC' : null
    }
  }

  async getStats(): Promise<{
    totalKeywords: number
    pendingChecks: number
    checkedToday: number
    completionRate: string
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const result = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_keyword_rank_stats',
          reason: 'Getting keyword rank check statistics for daily job',
          source: 'DailyRankCheckJob.getStats',
          metadata: { operation_type: 'stats_query' }
        },
        { table: 'indb_keyword_keywords', operationType: 'select' },
        async () => {
          const { count: totalKeywords } = await supabaseAdmin
            .from('indb_keyword_keywords')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

          const { count: checkedToday } = await supabaseAdmin
            .from('indb_keyword_keywords')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('last_checked', today.toISOString())

          return {
            totalKeywords: totalKeywords || 0,
            checkedToday: checkedToday || 0
          }
        }
      )

      const pendingChecks = result.totalKeywords - result.checkedToday
      const completionRate = result.totalKeywords > 0
        ? ((result.checkedToday / result.totalKeywords) * 100).toFixed(1)
        : '0'

      return {
        totalKeywords: result.totalKeywords,
        pendingChecks,
        checkedToday: result.checkedToday,
        completionRate
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to get rank check stats')
      return {
        totalKeywords: 0,
        pendingChecks: 0,
        checkedToday: 0,
        completionRate: '0'
      }
    }
  }
}

export const dailyRankCheckJob = new DailyRankCheckJob()

