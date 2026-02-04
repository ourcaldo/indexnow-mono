import { NextRequest, NextResponse } from 'next/server'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { queueManager } from '@/lib/queues/QueueManager'
import { logger } from '@/lib/monitoring/error-handling'
import { 
  adminApiWrapper, 
  createStandardError, 
  formatSuccess, 
  formatError 
} from '@/lib/core/api-response-middleware'
import { ErrorType, ErrorSeverity } from '@indexnow/shared'
import { z } from 'zod'

const BULL_BOARD_USERNAME = process.env.BULL_BOARD_USERNAME
const BULL_BOARD_PASSWORD = process.env.BULL_BOARD_PASSWORD

// Zod Schema for Actions
const ActionSchema = z.object({
  action: z.enum(['retry', 'remove', 'pause', 'resume']),
  queue: z.string().min(1),
  jobId: z.string().optional(),
})

function checkSecurityRequirements(): { valid: boolean; error?: string } {
  if (process.env.ENABLE_BULLMQ !== 'true') {
    return { valid: false, error: 'BullMQ is not enabled. Set ENABLE_BULLMQ=true to use Bull Board.' }
  }

  if (!BULL_BOARD_USERNAME || !BULL_BOARD_PASSWORD) {
    return { 
      valid: false, 
      error: 'Bull Board credentials not configured. Set BULL_BOARD_USERNAME and BULL_BOARD_PASSWORD environment variables.' 
    }
  }

  // Enforce minimum password length for Bull Board
  if (BULL_BOARD_PASSWORD.length < 12) {
    return {
      valid: false,
      error: 'Bull Board password is too weak. Please set a BULL_BOARD_PASSWORD with at least 12 characters.'
    }
  }

  return { valid: true }
}

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.slice(6)
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return username === BULL_BOARD_USERNAME && password === BULL_BOARD_PASSWORD
}

function createUnauthorizedResponse(): NextResponse {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Bull Board"',
    },
  })
}

let bullBoard: ReturnType<typeof createBullBoard> | null = null

async function initializeBullBoard() {
  if (bullBoard) {
    return bullBoard
  }

  try {
    const queues = [
      'rank-check',
      'rank-schedule',
      'email',
      'payments',
      'trial-monitor',
      'keyword-enrichment',
      'quota-reset',
      'indexing-monitor',
      'auto-cancel',
    ]

    const queueAdapters = await Promise.all(queues.map(async queueName => 
      new BullMQAdapter(await queueManager.getQueue(queueName))
    ))

    bullBoard = createBullBoard({
      queues: queueAdapters,
      serverAdapter: {} as any, // Bull Board requires a server adapter, but we're using it as an API
    })

    logger.info({ queueCount: queues.length }, 'Bull Board initialized')
    
    return bullBoard
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Failed to initialize Bull Board'
    )
    throw error
  }
}

export const GET = adminApiWrapper(async (request: NextRequest) => {
  const securityCheck = checkSecurityRequirements()
  if (!securityCheck.valid) {
    logger.error({ error: securityCheck.error }, 'Bull Board security check failed')
    const error = await createStandardError(
      ErrorType.SYSTEM,
      securityCheck.error || 'Security check failed',
      { statusCode: 503, severity: ErrorSeverity.HIGH }
    )
    return formatError(error)
  }

  // Double layer: System Admin Auth (via wrapper) + Optional Basic Auth
  if (BULL_BOARD_USERNAME && BULL_BOARD_PASSWORD && !checkAuth(request)) {
    return createUnauthorizedResponse()
  }

  try {
    const board = await initializeBullBoard()
    
    const queuesData = await Promise.all(
      board.queues.map(async (queue: any) => {
        const queueInstance = queue.queue
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queueInstance.getWaitingCount(),
          queueInstance.getActiveCount(),
          queueInstance.getCompletedCount(),
          queueInstance.getFailedCount(),
          queueInstance.getDelayedCount(),
        ])

        return {
          name: queue.name,
          counts: {
            waiting,
            active,
            completed,
            failed,
            delayed,
          },
        }
      })
    )

    return formatSuccess({
      queues: queuesData
    })
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Bull Board API error'
    )
    
    const structuredError = await createStandardError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : 'Internal server error',
      { statusCode: 500, severity: ErrorSeverity.HIGH }
    )
    return formatError(structuredError)
  }
})

export const POST = adminApiWrapper(async (request: NextRequest) => {
  const securityCheck = checkSecurityRequirements()
  if (!securityCheck.valid) {
    logger.error({ error: securityCheck.error }, 'Bull Board security check failed')
    const error = await createStandardError(
      ErrorType.SYSTEM,
      securityCheck.error || 'Security check failed',
      { statusCode: 503, severity: ErrorSeverity.HIGH }
    )
    return formatError(error)
  }

  // Double layer: System Admin Auth (via wrapper) + Optional Basic Auth
  if (BULL_BOARD_USERNAME && BULL_BOARD_PASSWORD && !checkAuth(request)) {
    return createUnauthorizedResponse()
  }

  try {
    const body = await request.json()
    
    const validation = ActionSchema.safeParse(body)
    if (!validation.success) {
      const error = await createStandardError(
        ErrorType.VALIDATION,
        'Invalid request body',
        { 
          statusCode: 400, 
          severity: ErrorSeverity.LOW,
          metadata: { issues: validation.error.issues }
        }
      )
      return formatError(error)
    }

    const { action, queue: queueName, jobId } = validation.data
    const queue = await queueManager.getQueue(queueName)

    switch (action) {
      case 'retry':
        if (jobId) {
          const job = await queue.getJob(jobId)
          if (job) {
            await job.retry()
            return formatSuccess({ message: 'Job retried' })
          }
        }
        break
      
      case 'remove':
        if (jobId) {
          const job = await queue.getJob(jobId)
          if (job) {
            await job.remove()
            return formatSuccess({ message: 'Job removed' })
          }
        }
        break
      
      case 'pause':
        await queue.pause()
        return formatSuccess({ message: 'Queue paused' })
      
      case 'resume':
        await queue.resume()
        return formatSuccess({ message: 'Queue resumed' })
    }

    const error = await createStandardError(
      ErrorType.NOT_FOUND,
      'Job not found or invalid action',
      { statusCode: 404, severity: ErrorSeverity.LOW }
    )
    return formatError(error)

  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Bull Board action error'
    )
    
    const structuredError = await createStandardError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : 'Internal server error',
      { statusCode: 500, severity: ErrorSeverity.HIGH }
    )
    return formatError(structuredError)
  }
})
