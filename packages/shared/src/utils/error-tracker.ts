/**
 * Error Tracking System
 * Tracks and monitors rank checking errors for analysis and alerts
 */

import { RankCheckError, ErrorStats, SystemErrorStats } from '../types/monitoring/ErrorTrackingTypes';
import { trackError, trackEvent } from './analytics';

export class ErrorTracker {
  /**
   * Log error to analytics system
   */
  async logError(error: RankCheckError): Promise<void> {
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
   * Get error statistics (Placeholder - should be implemented via API/Database)
   */
  async getErrorStats(_userId: string, _dateRange: { start: Date, end: Date }): Promise<ErrorStats[]> {
    console.warn('getErrorStats is not implemented in shared package');
    return [];
  }

  /**
   * Get system-wide error statistics (Placeholder - should be implemented via API/Database)
   */
  async getSystemErrorStats(_dateRange?: { start: Date, end: Date }): Promise<SystemErrorStats> {
    return {
      totalErrors: 0,
      errorsByType: [],
      criticalErrors: 0,
      affectedUsers: 0,
      trends: {}
    };
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();
