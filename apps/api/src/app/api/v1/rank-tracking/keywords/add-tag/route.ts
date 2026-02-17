/**
 * Rank Tracking - Add Tag to Keywords API
 * POST /api/v1/rank-tracking/keywords/add-tag
 * 
 * Adds a tag to one or more keywords
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

const addTagSchema = z.object({
    keywordIds: z.array(z.string().uuid()).min(1, 'At least one keyword ID is required'),
    tag: z.string().min(1, 'Tag is required').max(50, 'Tag must be 50 characters or less')
});


export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const body = await request.json();
        const validation = addTagSchema.safeParse(body);

        if (!validation.success) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                validation.error.issues[0].message,
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const { keywordIds, tag } = validation.data;
        const cleanTag = tag.trim().toLowerCase();

        const result = await SecureServiceRoleWrapper.executeWithUserSession(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'add_tag_to_keywords',
                source: 'rank-tracking/keywords/add-tag',
                reason: 'User adding tags to their keywords',
                metadata: { keywordIds, tag: cleanTag, keywordCount: keywordIds.length },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_rank_keywords', operationType: 'update' },
            async () => {
                // Use atomic RPC — single transaction for all keyword tag updates
                const { data, error } = await supabaseAdmin
                    .rpc('add_tags_to_keywords_atomic', {
                        target_keyword_ids: keywordIds,
                        target_user_id: auth.userId,
                        new_tags: [cleanTag]
                    });

                if (error) throw new Error(`Failed to add tags: ${error.message}`);
                return { updatedCount: data || 0 };
            }
        );

        if (result.updatedCount === 0) {
            return formatSuccess({ message: 'All selected keywords already have this tag' });
        }

        return formatSuccess({
            message: `Successfully added tag "${tag}" to ${result.updatedCount} keywords`
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/rank-tracking/keywords/add-tag', method: 'POST', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
