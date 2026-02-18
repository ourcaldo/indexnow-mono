/**
 * Error Tracking System
 * Tracks and monitors rank checking errors for analysis and alerts
 */

import type { RankCheckError, ErrorStats, SystemErrorStats } from '@indexnow/shared';
import { trackError, trackEvent } from './index';

export class ErrorTracker {
  /** In-memory log of recent errors (bounded by `maxErrors`). */
  private readonly errors: RankCheckError[] = [];
  private readonly maxErrors: number;

  constructor(maxErrors = 1000) {
    this.maxErrors = maxErrors;
  }

  /**
   * Log error to analytics system and store in memory for stats queries.
   */
  async logError(error: RankCheckError): Promise<void> {
    // Store for in-memory stats
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.splice(0, this.errors.length - this.maxErrors);
    }

    // In the browser, we track to analytics
    // On the server, this could be extended to log to database
    trackError(new Error(error.errorMessage), {
      keywordId: error.keywordId,
      userId: error.userId,
      errorType: error.errorType,
      severity: error.severity,
      ...(error.context || {})
    });

    trackEvent('rank_check_error', {
      ...error,
      timestamp: error.timestamp instanceof Date ? error.timestamp.toISOString() : error.timestamp
    });
  }

  /**
   * Get error statistics for a specific user within a date range.
   */
  async getErrorStats(userId: string, dateRange: { start: Date; end: Date }): Promise<ErrorStats[]> {
    const filtered = this.errors.filter((e) => {
      const ts = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
      return e.userId === userId && ts >= dateRange.start && ts <= dateRange.end;
    });

    return this.aggregateByType(filtered);
  }

  /**
   * Get system-wide error statistics, optionally filtered by date range.
   */
  async getSystemErrorStats(dateRange?: { start: Date; end: Date }): Promise<SystemErrorStats> {
    const filtered = dateRange
      ? this.errors.filter((e) => {
          const ts = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
          return ts >= dateRange.start && ts <= dateRange.end;
        })
      : this.errors;

    const errorsByType = this.aggregateByType(filtered);
    const criticalErrors = filtered.filter((e) => e.severity === 'critical').length;
    const affectedUsers = new Set(filtered.map((e) => e.userId)).size;

    // Trends: error count per calendar day (YYYY-MM-DD)
    const trends: Record<string, number> = {};
    for (const e of filtered) {
      const day = (e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp))
        .toISOString()
        .slice(0, 10);
      trends[day] = (trends[day] ?? 0) + 1;
    }

    return {
      totalErrors: filtered.length,
      errorsByType,
      criticalErrors,
      affectedUsers,
      trends,
    };
  }

  // ── helpers ──────────────────────────────────────────────

  /**
   * Aggregate a list of errors into per-type `ErrorStats` entries.
   */
  private aggregateByType(errors: RankCheckError[]): ErrorStats[] {
    const map = new Map<
      string,
      { count: number; severity: string; lastOccurrence: Date; users: Set<string>; keywords: Set<string> }
    >();

    for (const e of errors) {
      const existing = map.get(e.errorType);
      const ts = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
      if (existing) {
        existing.count++;
        if (ts > existing.lastOccurrence) {
          existing.lastOccurrence = ts;
          existing.severity = e.severity; // keep severity of most recent
        }
        existing.users.add(e.userId);
        existing.keywords.add(e.keywordId);
      } else {
        map.set(e.errorType, {
          count: 1,
          severity: e.severity,
          lastOccurrence: ts,
          users: new Set([e.userId]),
          keywords: new Set([e.keywordId]),
        });
      }
    }

    return Array.from(map.entries()).map(([errorType, v]) => ({
      errorType,
      count: v.count,
      severity: v.severity,
      lastOccurrence: v.lastOccurrence,
      affectedUsers: v.users.size,
      affectedKeywords: v.keywords.size,
    }));
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();
