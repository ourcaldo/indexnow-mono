/**
 * Rank Tracking - Bulk Delete Keywords API
 * DELETE /api/v1/rank-tracking/keywords/bulk-delete
 * 
 * Deletes multiple keywords and their related data (rankings, rank history)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

const bulkDeleteSchema = z.object({
    keywordIds: z.array(z.string().uuid()).min(1, 'At least one keyword ID is required')
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
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'bulk_delete_keywords',
                source: 'rank-tracking/keywords/bulk-delete',
                reason: 'User bulk deleting keywords and related data',
                metadata: { keywordIds, keywordCount: keywordIds.length },
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_rank_keywords', operationType: 'delete' },
            async (db) => {
                // Verify all keywords belong to user
                const { data: verifiedKeywords, error: verifyError } = await db
                    .from('indb_rank_keywords')
                    .select('id')
                    .in('id', keywordIds)
                    .eq('user_id', auth.userId);

                if (verifyError) throw new Error(`Failed to verify keywords: ${verifyError.message}`);
                if (!verifiedKeywords || verifiedKeywords.length !== keywordIds.length) {
                    throw new Error('Some keywords not found or access denied');
                }

                const verifiedIds = verifiedKeywords.map(kw => kw.id);

                // Delete related data in order: history → rankings → keywords
                // Note: indb_keyword_rank_history might not exist or logic changed?
                // Assuming indb_keyword_rankings acts as history/rankings source
                await db.from('indb_keyword_rankings').delete().in('keyword_id', verifiedIds);
                await db.from('indb_rank_keywords').delete().in('id', verifiedIds);

                return verifiedIds.length;
            }
        );

        return formatSuccess({ message: `Successfully deleted ${deletedCount} keywords` });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/rank-tracking/keywords/bulk-delete', method: 'DELETE', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
