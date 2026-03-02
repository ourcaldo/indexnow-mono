/**
 * Error Statistics API Endpoint
 * Provides comprehensive error tracking statistics for admin dashboard
 * Uses direct queries instead of RPCs for compatibility
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { adminApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

interface ErrorCount {
  message: string;
  error_type: string;
  severity: string;
  count: number;
}

interface EndpointCount {
  endpoint: string;
  count: number;
}

interface StatsResult {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    warningErrors: number;
    infoErrors: number;
    unresolvedErrors: number;
  };
  distributions: {
    bySeverity: Record<string, number>;
    byEndpoint: EndpointCount[];
  };
  topErrors: ErrorCount[];
  trend: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    previousPeriodCount: number;
    currentPeriodCount: number;
  };
  timeRange: string;
}

/**
 * GET /api/v1/admin/errors/stats
 * Query Parameters:
 * - range: Time range (24h, 7d, 30d) - defaults to 24h
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  const { searchParams } = new URL(request.url);
  const endpoint = new URL(request.url).pathname;
  const timeRange = searchParams.get('range') || '24h';

  const stats = await SecureServiceRoleWrapper.executeSecureOperation<StatsResult>(
    {
      userId: adminUser.id,
      operation: 'fetch_error_statistics',
      reason: 'Admin viewing error dashboard statistics',
      source: endpoint,
      metadata: { timeRange },
    },
    {
      table: 'indb_system_error_logs',
      operationType: 'select',
      columns: ['*'],
      whereConditions: {},
    },
    async () => {
      const timeFilter = getTimeFilter(timeRange);
      const previousTimeFilter = getPreviousTimeFilter(timeRange);

      // Fetch a batch of recent errors to compute distributions in JS
      const { data: recentErrors, error: batchError, count: totalErrors } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('message, error_type, severity, endpoint', { count: 'exact' })
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false })
        .limit(500);
      if (batchError) throw batchError;

      const rows = recentErrors || [];
      const total = totalErrors || 0;

      // Compute severity counts from rows
      const severityCounts: Record<string, number> = {};
      for (const r of rows) {
        severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
      }

      // Compute endpoint distribution from rows
      const epMap: Record<string, number> = {};
      for (const r of rows) {
        if (r.endpoint) epMap[r.endpoint] = (epMap[r.endpoint] || 0) + 1;
      }
      const topEndpoints: EndpointCount[] = Object.entries(epMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ep, count]) => ({ endpoint: ep, count }));

      // Compute top errors (grouped by message)
      const errorMap: Record<string, ErrorCount> = {};
      for (const r of rows) {
        if (!errorMap[r.message]) {
          errorMap[r.message] = { message: r.message, error_type: r.error_type, severity: r.severity, count: 0 };
        }
        errorMap[r.message].count++;
      }
      const topErrors = Object.values(errorMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Unresolved count
      const { count: unresolvedErrors, error: unresolvedError } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null)
        .gte('created_at', timeFilter);
      if (unresolvedError) throw unresolvedError;

      // Previous period count for trend
      const { count: previousPeriodErrors, error: trendError } = await supabaseAdmin
        .from('indb_system_error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousTimeFilter)
        .lt('created_at', timeFilter);
      if (trendError) throw trendError;

      const trend =
        previousPeriodErrors && previousPeriodErrors > 0
          ? (((total) - previousPeriodErrors) / previousPeriodErrors) * 100
          : total > 0
            ? 100
            : 0;

      return {
        summary: {
          totalErrors: total,
          criticalErrors: severityCounts['critical'] || 0,
          highErrors: severityCounts['error'] || 0,
          warningErrors: severityCounts['warning'] || 0,
          infoErrors: (severityCounts['info'] || 0) + (severityCounts['debug'] || 0),
          unresolvedErrors: unresolvedErrors || 0,
        },
        distributions: {
          bySeverity: severityCounts,
          byEndpoint: topEndpoints,
        },
        topErrors,
        trend: {
          value: Math.round(trend * 10) / 10,
          direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
          previousPeriodCount: previousPeriodErrors || 0,
          currentPeriodCount: total,
        },
        timeRange,
      };
    }
  );

  return formatSuccess(stats);
});

function getTimeFilter(range: string): string {
  const now = new Date();
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function getPreviousTimeFilter(range: string): string {
  const now = new Date();
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  }
}
