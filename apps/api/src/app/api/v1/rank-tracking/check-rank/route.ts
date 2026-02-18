/**
 * Rank Tracking - Check Rank API
 * POST /api/v1/rank-tracking/check-rank - Trigger manual rank check for a keyword
 * GET /api/v1/rank-tracking/check-rank - Check rank tracker config/quota
 * 
 * Triggers a rank check using Firecrawl API and saves results
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type DbRankKeywordRow , getClientIP} from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { RankTracker } from '@/lib/rank-tracking/rank-tracker';

const checkRankSchema = z.object({
    keyword_id: z.string().uuid('Invalid keyword ID')
});

type RankKeywordSelect = Pick<DbRankKeywordRow, 'id' | 'keyword' | 'device' | 'user_id' | 'domain' | 'country' | 'is_active'>;

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const body = await request.json();
        const validation = checkRankSchema.safeParse(body);
        if (!validation.success) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                validation.error.issues[0].message,
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const { keyword_id } = validation.data;

        // Fetch keyword details (from indb_rank_keywords)
        const keywordData = await SecureServiceRoleWrapper.executeWithUserSession<RankKeywordSelect>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_keyword_for_rank_check',
                source: 'rank-tracking/check-rank',
                reason: 'Fetching keyword details to perform manual rank check',
                metadata: { keywordId: keyword_id },
                ipAddress: getClientIP(request) ?? undefined,
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_rank_keywords', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_rank_keywords')
                    .select('id, keyword, device, user_id, domain, country, is_active')
                    .eq('id', keyword_id)
                    .eq('user_id', auth.userId)
                    .single();

                if (error) throw new Error('Keyword not found or access denied');
                return data as RankKeywordSelect;
            }
        );

        if (!keywordData || !keywordData.is_active) {
            const notFoundError = await ErrorHandlingService.createError(
                ErrorType.NOT_FOUND,
                'Keyword not found or access denied',
                { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 404 }
            );
            return formatError(notFoundError);
        }

        // Check and consume user daily quota atomically (prevents TOCTOU race)
        const { data: quotaConsumed, error: quotaError } = await (supabaseAdmin.rpc as Function)(
            'consume_user_quota',
            { target_user_id: auth.userId, quota_amount: 1 }
        );

        if (quotaError || !quotaConsumed) {
            const quotaErr = await ErrorHandlingService.createError(
                ErrorType.RATE_LIMIT,
                'Daily quota exceeded. Quota resets daily.',
                {
                    severity: ErrorSeverity.MEDIUM,
                    userId: auth.userId,
                    statusCode: 429
                }
            );
            return formatError(quotaErr);
        }

        // Perform rank check via Firecrawl
        const domainName = keywordData.domain;
        if (!domainName) {
            const domainError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Keyword has no associated domain',
                { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 400 }
            );
            return formatError(domainError);
        }

        const deviceType = keywordData.device === 'mobile' ? 'mobile' : 'desktop';
        const rankResult = await RankTracker.checkRank(
            keywordData.keyword,
            domainName,
            keywordData.country || 'us',
            deviceType
        );

        // Save result to database (quota already consumed atomically above)
        await SecureServiceRoleWrapper.executeSecureOperation(
            {
                userId: auth.userId,
                operation: 'save_rank_check_result',
                source: 'rank-tracking/check-rank',
                reason: 'Saving rank check result after manual check',
                metadata: { keywordId: keyword_id, position: rankResult.position },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_rank_keywords', operationType: 'update' },
            async () => {
                const now = new Date().toISOString();
                const checkDate = now.split('T')[0];

                // Update keyword position
                const { error: updateError } = await supabaseAdmin
                    .from('indb_rank_keywords')
                    .update({ position: rankResult.position, last_checked: now })
                    .eq('id', keyword_id);

                if (updateError) throw new Error(`Failed to update keyword: ${updateError.message}`);

                // Resolve country code to FK
                let countryId: string | null = null;
                if (keywordData.country) {
                    const { data: countryData } = await supabaseAdmin
                        .from('indb_keyword_countries')
                        .select('id')
                        .eq('iso2_code', keywordData.country.toLowerCase())
                        .limit(1)
                        .single();
                    countryId = countryData?.id ?? null;
                }

                // Insert ranking history
                const { error: insertError } = await supabaseAdmin
                    .from('indb_keyword_rankings')
                    .insert({
                        keyword_id: keyword_id,
                        position: rankResult.position,
                        url: rankResult.url,
                        check_date: checkDate,
                        device_type: keywordData.device,
                        country_id: countryId
                    });

                if (insertError) throw new Error(`Failed to insert ranking: ${insertError.message}`);
                return null;
            }
        );

        return formatSuccess({
            data: {
                keyword: keywordData.keyword,
                domain: domainName,
                ranking: {
                    position: rankResult.position,
                    url: rankResult.url,
                    foundInTop100: rankResult.foundInTop100
                }
            },
            message: 'Rank check completed successfully'
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.EXTERNAL_API,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.HIGH,
                userId: auth.userId,
                endpoint: '/api/v1/rank-tracking/check-rank',
                method: 'POST',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    try {
        const integration = await SecureServiceRoleWrapper.executeWithUserSession<{
            api_quota_limit: number;
            api_quota_used: number;
            quota_reset_date: string | null;
            is_active: boolean;
        } | null>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'check_rank_tracker_config',
                source: 'rank-tracking/check-rank',
                reason: 'User checking if rank tracker API is configured and quota availability',
                metadata: { serviceName: 'custom_tracker' },
                ipAddress: getClientIP(request) ?? undefined,
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_site_integration', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_site_integration')
                    .select('api_quota_limit, api_quota_used, quota_reset_date, is_active')
                    .eq('service_name', 'custom_tracker')
                    .maybeSingle();

                if (error) throw new Error(`Failed to check config: ${error.message}`);
                return data;
            }
        );

        if (!integration) {
            return formatSuccess({
                configured: false,
                message: 'IndexNow Rank Tracker API not configured. Please contact admin to configure API integration.'
            });
        }

        const availableQuota = integration.api_quota_limit - integration.api_quota_used;

        return formatSuccess({
            configured: true,
            message: 'Rank Tracker API is configured and active',
            quotaInfo: {
                limit: integration.api_quota_limit,
                used: integration.api_quota_used,
                available: Math.max(0, availableQuota),
                resetDate: integration.quota_reset_date,
                isActive: integration.is_active
            }
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.MEDIUM,
                userId: auth.userId,
                endpoint: '/api/v1/rank-tracking/check-rank',
                method: 'GET',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});
