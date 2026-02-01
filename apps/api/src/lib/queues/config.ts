import { ConnectionOptions } from 'bullmq'
import { AppConfig } from '@indexnow/shared'

export const redisConnection: ConnectionOptions = {
  host: AppConfig.redis.host || 'localhost',
  port: AppConfig.redis.port || 6379,
  password: AppConfig.redis.password || undefined,
  username: AppConfig.redis.user || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 3600,
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600,
  },
}

export const queueConfig = {
  rankCheck: {
    name: 'rank-check',
    concurrency: AppConfig.bullmq.concurrency.rankCheck,
    limiter: {
      max: AppConfig.bullmq.rateLimit.rankCheck.max,
      duration: AppConfig.bullmq.rateLimit.rankCheck.duration,
    },
  },
  rankSchedule: {
    name: 'rank-schedule',
    concurrency: 1,
  },
  email: {
    name: 'email',
    concurrency: AppConfig.bullmq.concurrency.email,
    limiter: {
      max: AppConfig.bullmq.rateLimit.email.max,
      duration: AppConfig.bullmq.rateLimit.email.duration,
    },
  },
  payments: {
    name: 'payments',
    concurrency: AppConfig.bullmq.concurrency.payments,
  },
  keywordEnrichment: {
    name: 'keyword-enrichment',
    concurrency: 1,
  },
  autoCancel: {
    name: 'auto-cancel',
    concurrency: 1,
  },
  hourlyRankRetry: {
    name: 'hourly-rank-retry',
    concurrency: 1,
  },
}
