import { NextRequest } from 'next/server'
import { adminApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { userManagementService } from '@/lib/services'
import { ErrorType, ErrorSeverity } from '@indexnow/shared'

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<{ id: string }> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  try {
    const quota = await userManagementService.getUserQuota(userId)
    return formatSuccess(quota)
  } catch (error) {
    return formatError({
      id: 'quota-fetch-error',
      type: ErrorType.SYSTEM,
      message: error instanceof Error ? error.message : 'Failed to fetch user quota',
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      statusCode: 500,
      details: { userId }
    })
  }
})
