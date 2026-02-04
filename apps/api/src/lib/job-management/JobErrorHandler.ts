/**
 * Job Error Handler
 * Standardized error handling for background jobs and worker processes
 */

import { logger } from '../monitoring/error-handling';
import { JobError, JobErrorType } from '../rank-tracking/seranking/types/EnrichmentJobTypes';

export interface JobErrorContext {
  jobId: string;
  jobType: string;
  jobName: string;
  metadata?: Record<string, unknown>;
}

export class JobErrorHandler {
  /**
   * Type guard to check if an error is a JobError
   */
  static isJobError(error: unknown): error is JobError {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as Record<string, unknown>;
    const validTypes = Object.values(JobErrorType) as string[];

    return (
      typeof candidate.type === 'string' &&
      validTypes.includes(candidate.type) &&
      typeof candidate.message === 'string' &&
      typeof candidate.retryable === 'boolean' &&
      candidate.timestamp instanceof Date
    );
  }

  /**
   * Execute a job operation with standardized error handling and logging
   */
  static async withJobErrorHandling<T>(
    operation: () => Promise<T>,
    context: JobErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log the error with full context
      logger.error(
        {
          ...context,
          error: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString()
        },
        `Job execution failed: ${context.jobName} (${context.jobId})`
      );

      // Wrap in a JobError if it isn't already
      if (!JobErrorHandler.isJobError(error)) {
        const jobError: JobError = {
          type: JobErrorType.WORKER_ERROR,
          message: errorMessage,
          retryable: this.isRetryableError(error),
          timestamp: new Date(),
          details: errorStack,
          context: {
            jobId: context.jobId
          }
        };
        throw jobError;
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable based on common patterns
   */
  private static isRetryableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Common network/timeout/concurrency errors that should be retried
    const retryablePatterns = [
      'timeout',
      'network error',
      'connection reset',
      'socket hang up',
      'econnreset',
      'etimedout',
      'rate limit',
      'too many requests',
      '429',
      '502',
      '503',
      '504',
      'deadlock',
      'serialization failure'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Format a JobError for API responses
   */
  static formatJobError(error: JobError): string {
    return `[${error.type}] ${error.message}${error.retryable ? ' (Will retry)' : ''}`;
  }
}
