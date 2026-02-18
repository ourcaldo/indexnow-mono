/**
 * Rank Tracking - Bulk Delete Keywords API
 * DELETE /api/v1/rank-tracking/keywords/bulk-delete
 *
 * Deletes multiple keywords and their related data (rankings, rank history)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper, supabaseAdmin, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

const bulkDeleteSchema = z.object({
  keywordIds: z.array(z.string().uuid()).min(1, 'At least one keyword ID is required'),
});

export const DELETE = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0].message,
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }

    const { keywordIds } = validation.data;

    const deletedCount = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'bulk_delete_keywords',
        source: 'rank-tracking/keywords/bulk-delete',
        reason: 'User bulk deleting keywords and related data',
        metadata: { keywordIds, keywordCount: keywordIds.length },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
      { table: 'indb_rank_keywords', operationType: 'delete' },
      async () => {
        // Atomic RPC: verifies ownership, deletes rankings, then keywords in one transaction
        const { data, error } = await (supabaseAdmin.rpc as Function)(
          'bulk_delete_keywords_service',
          {
            p_keyword_ids: keywordIds,
            p_user_id: auth.userId,
          }
        );

        if (error) throw new Error(`Failed to delete keywords: ${error.message}`);
        return data || 0;
      }
    );

    return formatSuccess({ message: `Successfully deleted ${deletedCount} keywords` });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/keywords/bulk-delete',
        method: 'DELETE',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
