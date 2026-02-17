/**
 * POST /api/v1/activity
 * Log user activity from frontend (payment pages, checkout, etc.)
 * 
 * Authentication: Requires authenticated user (NOT admin)
 * Database: Uses ActivityLogger which internally uses service role key for secure writes
 */

import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import { z } from 'zod';

const activitySchema = z.object({
    eventType: z.string().optional(),
    action_type: z.string().optional(),
    actionDescription: z.string().optional(),
    action_description: z.string().optional(),
    ip_address: z.string().optional(),
    user_agent: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const rawBody = await request.json();
        const parseResult = activitySchema.safeParse(rawBody);
        if (!parseResult.success) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                parseResult.error.errors[0]?.message || 'Invalid request body',
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }
        const body = parseResult.data;

        const userId = auth.userId;
        const userEmail = auth.user.email || '';

        // Extract and parse IP address properly (handle multiple IPs from proxy)
        const rawIpAddress = getClientIP(request) ?? body.ip_address ?? '';
        const cleanIpAddress = rawIpAddress.split(',')[0].trim() || '';

        // Log the activity using the ActivityLogger static method
        // ActivityLogger internally uses supabaseAdmin (service role key) to write to database
        await ActivityLogger.logActivity({
            userId,
            eventType: body.eventType || body.action_type || 'system_action',
            actionDescription: body.actionDescription || body.action_description || 'User action performed',
            ipAddress: cleanIpAddress,
            userAgent: request.headers.get('user-agent') || body.user_agent || '',
            request,
            metadata: {
                userEmail,
                originalIpHeader: rawIpAddress,
                ...body.metadata || {}
            }
        });

        return formatSuccess({
            message: 'Activity logged successfully'
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.LOW,
                userId: auth.userId,
                endpoint: '/api/v1/activity',
                method: 'POST',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});
