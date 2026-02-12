import { NextRequest } from 'next/server'
import { adminApiWrapper, createStandardError, formatError } from '@/lib/core/api-response-middleware'
import { formatSuccess } from '@/lib/core/api-response-formatter'
import { UserManagementService } from '@indexnow/services';
const userManagementService = new UserManagementService();
import { ErrorType, ErrorSeverity } from '@indexnow/shared'

export const GET = adminApiWrapper(async (
  request: NextRequest,
  adminUser,
  context?: { params: Promise<Record<string, string>> }
) => {
  if (!context) {
    throw new Error('Missing context parameters')
  }
  const { id: userId } = await context.params

  try {
    const quota = await userManagementService.getUserQuota(userId)
    return formatSuccess(quota)
  } catch (error) {
    return formatError(await createStandardError(
      ErrorType.SYSTEM,
      error instanceof Error ? error.message : 'Failed to fetch user quota',
      { statusCode: 500, severity: ErrorSeverity.MEDIUM, metadata: { userId } }
    ))
  }
})
