import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { escapeLikePattern } from '@indexnow/shared';
import { adminApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

interface ErrorLog {
  id: string;
  error_type: string;
  severity: string;
  message: string;
  user_message?: string;
  user_id?: string;
  endpoint?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

/**
 * GET /api/v1/admin/errors
 * Retrieve paginated error list with comprehensive filtering
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100, max: 200)
 * - severity: Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)
 * - type: Filter by error type (AUTHENTICATION, DATABASE, EXTERNAL_API, etc.)
 * - userId: Filter by user ID
 * - endpoint: Filter by endpoint (partial match)
 * - dateFrom: Filter errors from date (ISO 8601)
 * - dateTo: Filter errors to date (ISO 8601)
 * - status: Filter by resolution status (new, acknowledged, resolved)
 * - search: Full-text search in message and user_message
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: Sort order (asc|desc, default: desc)
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  const { searchParams } = new URL(request.url);
  const endpoint = new URL(request.url).pathname;

  // Parse pagination parameters
  const parsedPage = parseInt(searchParams.get('page') || '1');
  const parsedLimit = parseInt(searchParams.get('limit') || '100');
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  const limit = Number.isNaN(parsedLimit) ? 100 : Math.min(200, Math.max(1, parsedLimit));
  const offset = (page - 1) * limit;

  // Parse filter parameters
  const severityParam = searchParams.get('severity') || undefined;
  const validSeverities = ['debug', 'info', 'warning', 'error', 'critical'] as const;
  const severity =
    severityParam && validSeverities.includes(severityParam as (typeof validSeverities)[number])
      ? (severityParam as (typeof validSeverities)[number])
      : undefined;
  const errorType = searchParams.get('type') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const endpointFilter = searchParams.get('endpoint') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  // (#V7 M-19) Parse sort parameters with column allowlist to prevent SQL injection
  const ALLOWED_SORT_COLUMNS = [
    'created_at',
    'error_type',
    'severity',
    'source',
    'status',
    'endpoint',
  ] as const;
  const rawSortBy = searchParams.get('sortBy') || 'created_at';
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(rawSortBy)
    ? rawSortBy
    : 'created_at';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  interface QueryResult {
    errors: ErrorLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: Record<string, string | undefined>;
    sort: { sortBy: string; sortOrder: string };
  }

  const result = await SecureServiceRoleWrapper.executeSecureOperation<QueryResult>(
    {
      userId: adminUser.id,
      operation: 'fetch_error_list',
      reason: 'Admin viewing paginated error list with filters',
      source: endpoint,
      metadata: {
        page,
        limit,
        filters: {
          severity: severity ?? null,
          errorType: errorType ?? null,
          userId: userId ?? null,
          status: status ?? null,
          hasSearch: !!search,
        },
      },
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
      whereConditions: {},
    },
    async () => {
      // Build base query
      let query = supabaseAdmin.from('indb_system_error_logs').select('*', { count: 'exact' });

      // Apply filters
      if (severity) {
        query = query.eq('severity', severity);
      }

      if (errorType) {
        query = query.eq('error_type', errorType);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (endpointFilter) {
        query = query.ilike('endpoint', `%${escapeLikePattern(endpointFilter)}%`);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      // Resolution status filtering
      if (status === 'resolved') {
        query = query.not('resolved_at', 'is', null);
      } else if (status === 'acknowledged') {
        query = query.not('acknowledged_at', 'is', null).is('resolved_at', null);
      } else if (status === 'new') {
        query = query.is('acknowledged_at', null).is('resolved_at', null);
      }

      // Full-text search in message fields (escaped to prevent filter injection)
      if (search) {
        const escaped = escapeLikePattern(search);
        query = query.or(`message.ilike.%${escaped}%,user_message.ilike.%${escaped}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination and execute
      const { data: errors, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        errors: (errors || []) as ErrorLog[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNextPage: (count || 0) > offset + limit,
          hasPrevPage: page > 1,
        },
        filters: {
          severity,
          errorType,
          userId,
          endpoint: endpointFilter,
          dateFrom,
          dateTo,
          status,
          search,
        },
        sort: {
          sortBy,
          sortOrder,
        },
      };
    }
  );

  return formatSuccess(result);
});
