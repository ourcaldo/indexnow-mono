/**
 * SeRanking Quota Status API Endpoint
 * GET /api/v1/integrations/seranking/quota/status
 * 
 * Provides current quota usage status and limits
 * 
 * Note: The indb_seranking_integration table doesn't exist in the current schema.
 * This endpoint returns a stub response indicating the integration is not configured.
 * TODO: Create database migration for seranking integration table.
 */

import { NextRequest } from 'next/server';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

interface QuotaStatusData {
    current_usage: number;
    quota_limit: number;
    quota_remaining: number;
    usage_percentage: number;
    reset_date: string;
    is_approaching_limit: boolean;
    is_quota_exceeded: boolean;
    reset_interval: string;
    days_until_reset: number;
    is_configured: boolean;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    // TODO: Replace this stub with actual database query once indb_seranking_integration table is created
    // For now, return unconfigured status

    const isConfigured = false;

    if (!isConfigured) {
        // Return a stub response indicating integration is not configured
        const stubResponse: QuotaStatusData = {
            current_usage: 0,
            quota_limit: 0,
            quota_remaining: 0,
            usage_percentage: 0,
            reset_date: new Date().toISOString(),
            is_approaching_limit: false,
            is_quota_exceeded: false,
            reset_interval: 'monthly',
            days_until_reset: 30,
            is_configured: false
        };

        return formatSuccess({
            ...stubResponse,
            message: 'SeRanking integration is not configured. Please set up the integration first.'
        });
    }

    // This code path is not reachable until integration table is created
    const error = await ErrorHandlingService.createError(
        ErrorType.EXTERNAL_API,
        'SeRanking integration is not available',
        {
            severity: ErrorSeverity.LOW,
            statusCode: 503,
            userId: auth.userId,
            endpoint: '/api/v1/integrations/seranking/quota/status'
        }
    );
    return formatError(error);
});
