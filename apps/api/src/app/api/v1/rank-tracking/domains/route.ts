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
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

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
      {
        userId: auth.userId,
        operation: 'get_user_domains',
        source: 'rank-tracking/domains',
        reason: 'User fetching their domains with keyword counts',
        metadata: { endpoint: '/api/v1/rank-tracking/domains', method: 'GET', page, limit },
        ipAddress: getClientIP(request) ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
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
          .eq('is_active', true)
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
    )) as { domains: any[]; pagination: any };

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
    const profileCheck = (await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'check_user_subscription',
        source: 'rank-tracking/domains',
        reason: 'Checking user subscription before domain creation',
        metadata: { endpoint: '/api/v1/rank-tracking/domains', operation: 'create_domain' },
        ipAddress: getClientIP(request) ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      { table: 'indb_auth_user_profiles', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('is_active, package_id')
          .eq('user_id', auth.userId)
          .single();

        if (error) throw new Error('Failed to check subscription');
        return data;
      }
    )) as { is_active: boolean; package_id: string | null } | null;

    if (!profileCheck?.is_active || !profileCheck?.package_id) {
      const subscriptionError = await ErrorHandlingService.createError(
        ErrorType.AUTHORIZATION,
        'Active subscription required to add domains',
        { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 403 }
      );
      return formatError(subscriptionError);
    }

    const cleanDomain = domain_name
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();

    const newDomain = await SecureServiceRoleWrapper.executeWithUserSession(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'create_user_domain',
        source: 'rank-tracking/domains',
        reason: 'User creating a new domain for rank tracking',
        metadata: { domainName: cleanDomain, displayName: display_name || cleanDomain },
        ipAddress: getClientIP(request) ?? undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
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
