/**
 * Rank Tracking - Domains API
 * GET /api/v1/rank-tracking/domains - List user's domains
 * POST /api/v1/rank-tracking/domains - Create new domain
 *
 * Manages user's tracked domains for keyword ranking
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { SecureServiceRoleWrapper, supabaseAdmin, asTypedClient } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { buildOperationContext } from '@/lib/services/build-operation-context';
import { QuotaService } from '@indexnow/services';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { UserProfileService } from '@/lib/services/user-profile-service';

const createDomainSchema = z.object({
  domain_name: z.string().min(1, 'Domain name is required'),
  display_name: z.string().optional(),
});

interface DomainCounts {
  [domain: string]: number;
}

export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const parsedPage = parseInt(searchParams.get('page') || '1');
    const parsedLimit = parseInt(searchParams.get('limit') || '50');
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(200, Math.max(1, parsedLimit));
    const offset = (page - 1) * limit;

    const result = (await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      buildOperationContext(request, auth.userId, {
        operation: 'get_user_domains',
        source: 'rank-tracking/domains',
        reason: 'User fetching their domains with keyword counts',
        metadata: { page, limit },
      }),
      { table: 'indb_keyword_domains', operationType: 'select' },
      async (db) => {
        // 1. Fetch domains with pagination
        const {
          data: domainList,
          error: domainError,
          count,
        } = await db
          .from('indb_keyword_domains')
          .select('*', { count: 'exact' })
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (domainError) throw new Error(`Failed to fetch domains: ${domainError.message}`);

        // 2. Fetch keyword counts by domain via RPC (SQL GROUP BY instead of loading all rows)
        const { data: keywordCounts, error: kwError } = await (supabaseAdmin.rpc as Function)(
          'get_domain_keyword_counts',
          { p_user_id: auth.userId }
        );

        if (kwError) throw new Error(`Failed to fetch keyword counts: ${kwError.message}`);

        const counts: DomainCounts = keywordCounts || {};

        const total = count || 0;

        // 3. Merge counts
        return {
          domains: (domainList || []).map((d) => ({
            ...d,
            keyword_count: [{ count: counts[d.domain_name] || 0 }],
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: total > offset + limit,
            hasPrevPage: page > 1,
          },
        };
      }
      // (#V7 M-22) Type the result instead of using `any`
    )) as {
      domains: Array<
        { domain_name: string; keyword_count: Array<{ count: number }> } & Record<string, unknown>
      >;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };

    return formatSuccess({ data: result.domains, pagination: result.pagination });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/domains',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});

export const POST = authenticatedApiWrapper(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const validation = createDomainSchema.safeParse(body);

    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0].message,
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      );
      return formatError(validationError);
    }

    const { domain_name, display_name } = validation.data;

    // Check user has active subscription by checking profile
    const profileCheck = await UserProfileService.getSubscriptionCheck(
      auth, request, 'rank-tracking/domains',
    );

    if (!profileCheck?.is_active || !profileCheck?.package_id) {
      const subscriptionError = await ErrorHandlingService.createError(
        ErrorType.AUTHORIZATION,
        'Active subscription required to add domains',
        {
          severity: ErrorSeverity.MEDIUM,
          userId: auth.userId,
          statusCode: 403,
          userMessageKey: 'no_active_plan',
        }
      );
      return formatError(subscriptionError);
    }

    // Check domain quota before proceeding
    const canAdd = await QuotaService.canAddDomain(auth.userId);
    if (!canAdd) {
      const quotaError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Domain limit reached for your current plan',
        { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 403 }
      );
      return formatError(quotaError);
    }

    const cleanDomain = domain_name
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    const newDomain = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      buildOperationContext(request, auth.userId, {
        operation: 'create_user_domain',
        source: 'rank-tracking/domains',
        reason: 'User creating a new domain for rank tracking',
        metadata: { domainName: cleanDomain, displayName: display_name || cleanDomain },
      }),
      { table: 'indb_keyword_domains', operationType: 'insert' },
      async (db) => {
        // Check for existing domain
        const { data: existingDomain } = await db
          .from('indb_keyword_domains')
          .select('id')
          .eq('domain_name', cleanDomain)
          .eq('user_id', auth.userId)
          .maybeSingle();

        if (existingDomain) {
          throw new Error('Domain already exists');
        }

        const { data, error } = await db
          .from('indb_keyword_domains')
          .insert({
            domain_name: cleanDomain,
            display_name: display_name || cleanDomain,
            verification_status: 'verified',
            user_id: auth.userId,
          })
          .select()
          .single();

        if (error) throw new Error(`Failed to create domain: ${error.message}`);
        return data;
      }
    );

    try {
      await ActivityLogger.logActivity({
        userId: auth.userId,
        eventType: 'domain_create',
        actionDescription: `Added domain: ${cleanDomain}`,
        targetType: 'domain',
        targetId: newDomain.id,
        request,
        metadata: { domainName: cleanDomain },
      });
    } catch (logErr) {
      logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
    }

    return formatSuccess({ data: newDomain }, undefined, 201);
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/rank-tracking/domains',
        method: 'POST',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
