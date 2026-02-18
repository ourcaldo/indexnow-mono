import { NextRequest } from 'next/server';
import {
  adminApiWrapper,
  createStandardError,
  formatError,
} from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { UserManagementService } from '@indexnow/services';
const userManagementService = new UserManagementService(null);
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser, context) => {
  const { id: userId } = (await context.params) as Record<string, string>;

  try {
    const quota = await userManagementService.getUserQuota(userId, 'all');
    return formatSuccess(quota);
  } catch (error) {
    return formatError(
      await createStandardError(
        ErrorType.SYSTEM,
        error instanceof Error ? error.message : 'Failed to fetch user quota',
        { statusCode: 500, severity: ErrorSeverity.MEDIUM, metadata: { userId } }
      )
    );
  }
});
