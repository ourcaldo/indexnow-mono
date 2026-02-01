/**
 * Error Handling Service
 * Centralized error management, recovery strategies, and graceful degradation
 */

import {
  SeRankingErrorType,
  SeRankingError,
  SeRankingHealthCheckResult,
  ServiceResponse,
  SeRankingErrorContext,
  RecoveryResult,
  ISeRankingErrorHandler,
  JobErrorType
} from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';

// Error handling configuration
export interface ErrorHandlingConfig {
  maxRetryAttempts: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  retryMultiplier: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  enableGracefulDegradation: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Recovery strategy types
export type RecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'circuit_breaker'
  | 'graceful_degradation'
  | 'fail_fast';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Circuit breaker state
export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// Error statistics
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByOperations: Record<string, number>;
  averageRecoveryTime: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  circuitBreakerTrips: number;
  lastError?: {
    type: string;
    message: string;
    timestamp: Date;
    context: any;
  };
}

/**
 * Job Error Handler Utility
 */
export class JobErrorHandler {
  /**
   * Execute a job with standardized error handling
   */
  static async withJobErrorHandling<T>(
    operation: () => Promise<T>,
    context: {
      jobId: string;
      jobType: string;
      jobName: string;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.error(
        { 
          jobId: context.jobId, 
          jobType: context.jobType,
          error: error instanceof Error ? error.message : String(error),
          ...context.metadata 
        }, 
        `Job execution failed: ${context.jobName}`
      );
      throw error;
    }
  }
}

export class ErrorHandlingService implements ISeRankingErrorHandler {
  private config: ErrorHandlingConfig;
  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();
  private errorStats: ErrorStats;
  private errorHistory: Array<{error: any; context: any; timestamp: Date}> = [];

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      maxRetryAttempts: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      retryMultiplier: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      enableGracefulDegradation: true,
      logLevel: 'error',
      ...config
    };

    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByOperations: {},
      averageRecoveryTime: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      circuitBreakerTrips: 0
    };
  }

  /**
   * Handle error with recovery strategies
   */
  async handleError<T>(
    error: any,
    context: SeRankingErrorContext,
    recoveryFunction?: () => Promise<T>
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();
    const seRankingError = this.normalizeError(error, context);
    
    this.recordError(seRankingError, context);
    this.logErrorInternal(seRankingError, context);

    const strategy = this.determineRecoveryStrategy(seRankingError, context);
    
    try {
      switch (strategy) {
        case 'retry':
          return await this.retryWithBackoff(recoveryFunction, seRankingError, context, startTime);
          
        case 'circuit_breaker':
          return await this.handleCircuitBreaker(recoveryFunction, seRankingError, context, startTime);
          
        case 'fallback':
          return await this.handleFallback(seRankingError, context, startTime);
          
        case 'graceful_degradation':
          return await this.handleGracefulDegradation(seRankingError, context, startTime);
          
        case 'fail_fast':
        default:
          return {
            success: false,
            error: seRankingError,
            strategy,
            attempts: 1,
            totalTime: Date.now() - startTime,
            fallbackUsed: false
          };
      }
    } catch (recoveryError) {
      return {
        success: false,
        error: this.normalizeError(recoveryError, context),
        strategy,
        attempts: 1,
        totalTime: Date.now() - startTime,
        fallbackUsed: false
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation?: () => Promise<T>,
    originalError?: any,
    context?: SeRankingErrorContext,
    startTime: number = Date.now()
  ): Promise<RecoveryResult<T>> {
    if (!operation) {
      return {
        success: false,
        error: originalError,
        strategy: 'retry',
        attempts: 0,
        totalTime: Date.now() - startTime,
        fallbackUsed: false
      };
    }

    let lastError = originalError;
    let attempts = 0;

    for (let i = 0; i < this.config.maxRetryAttempts; i++) {
      attempts = i + 1;
      
      if (i > 0) {
        const delay = this.calculateBackoffDelay(i);
        await this.sleep(delay);
      }

      try {
        const result = await operation();
        this.recordSuccessfulRecovery(attempts, Date.now() - startTime);
        
        return {
          success: true,
          data: result,
          strategy: 'retry',
          attempts,
          totalTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        lastError = this.normalizeError(error, context);
        
        // Don't retry non-retryable errors
        if (!this.isRetryableError(lastError)) {
          break;
        }
        
        this.logErrorInternal(lastError, context, `Retry attempt ${attempts} failed`);
      }
    }

    this.recordFailedRecovery(attempts, Date.now() - startTime);
    
    return {
      success: false,
      error: lastError,
      strategy: 'retry',
      attempts,
      totalTime: Date.now() - startTime,
      fallbackUsed: false
    };
  }

  /**
   * Handle circuit breaker pattern
   */
  async handleCircuitBreaker<T>(
    operation?: () => Promise<T>,
    error?: any,
    context?: SeRankingErrorContext,
    startTime: number = Date.now()
  ): Promise<RecoveryResult<T>> {
    const breakerKey = this.getCircuitBreakerKey(context);
    const breaker = this.getCircuitBreakerState(breakerKey);
    
    // Check if circuit is open
    if (breaker.isOpen) {
      const now = Date.now();
      if (breaker.nextAttemptTime && now < breaker.nextAttemptTime.getTime()) {
        return {
          success: false,
          error: this.createCircuitBreakerError(breaker, context),
          strategy: 'circuit_breaker',
          attempts: 0,
          totalTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } else {
        // Try to reset circuit breaker
        breaker.isOpen = false;
        breaker.failureCount = 0;
      }
    }

    // Attempt operation
    if (operation) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker
        breaker.failureCount = 0;
        breaker.lastFailureTime = undefined;
        breaker.nextAttemptTime = undefined;
        
        return {
          success: true,
          data: result,
          strategy: 'circuit_breaker',
          attempts: 1,
          totalTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (operationError) {
        const normalizedError = this.normalizeError(operationError, context);
        
        // Increment failure count
        breaker.failureCount++;
        breaker.lastFailureTime = new Date();
        
        // Open circuit if threshold reached
        if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
          breaker.isOpen = true;
          breaker.nextAttemptTime = new Date(Date.now() + this.config.circuitBreakerTimeout);
          this.errorStats.circuitBreakerTrips++;
          
          this.logErrorInternal(normalizedError, context, 'Circuit breaker opened');
        }
        
        return {
          success: false,
          error: normalizedError,
          strategy: 'circuit_breaker',
          attempts: 1,
          totalTime: Date.now() - startTime,
          fallbackUsed: false
        };
      }
    }

    return {
      success: false,
      error,
      strategy: 'circuit_breaker',
      attempts: 0,
      totalTime: Date.now() - startTime,
      fallbackUsed: false
    };
  }

  /**
   * Handle fallback strategy
   */
  async handleFallback<T>(
    error?: any,
    context?: SeRankingErrorContext,
    startTime: number = Date.now()
  ): Promise<RecoveryResult<T>> {
    // Implement fallback data based on operation type
    let fallbackData: T | undefined;
    
    try {
      fallbackData = await this.generateFallbackData<T>(context);
      
      if (fallbackData !== undefined) {
        this.logErrorInternal(error, context, 'Using fallback data');
        
        return {
          success: true,
          data: fallbackData,
          strategy: 'fallback',
          attempts: 1,
          totalTime: Date.now() - startTime,
          fallbackUsed: true
        };
      }
    } catch (fallbackError) {
      this.logErrorInternal(
        this.normalizeError(fallbackError, context), 
        context, 
        'Fallback generation failed'
      );
    }

    return {
      success: false,
      error,
      strategy: 'fallback',
      attempts: 1,
      totalTime: Date.now() - startTime,
      fallbackUsed: false
    };
  }

  /**
   * Handle graceful degradation
   */
  async handleGracefulDegradation<T>(
    error?: any,
    context?: SeRankingErrorContext,
    startTime: number = Date.now()
  ): Promise<RecoveryResult<T>> {
    if (!this.config.enableGracefulDegradation) {
      return {
        success: false,
        error,
        strategy: 'graceful_degradation',
        attempts: 1,
        totalTime: Date.now() - startTime,
        fallbackUsed: false
      };
    }

    // Provide minimal service with degraded functionality
    const degradedData = this.generateDegradedResponse<T>(context);
    
    if (degradedData !== undefined) {
      this.logErrorInternal(error, context, 'Using degraded service response');
      
      return {
        success: true,
        data: degradedData,
        strategy: 'graceful_degradation',
        attempts: 1,
        totalTime: Date.now() - startTime,
        fallbackUsed: true
      };
    }

    return {
      success: false,
      error,
      strategy: 'graceful_degradation',
      attempts: 1,
      totalTime: Date.now() - startTime,
      fallbackUsed: false
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  /**
   * Get recent error history
   */
  getErrorHistory(limit: number = 100): Array<{error: any; context: any; timestamp: Date}> {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error statistics
   */
  clearErrorStats(): void {
    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByOperations: {},
      averageRecoveryTime: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      circuitBreakerTrips: 0
    };
    this.errorHistory = [];
  }

  /**
   * Get health status based on error patterns
   */
  getHealthStatus(): SeRankingHealthCheckResult {
    const recentErrors = this.getRecentErrors(300000); // Last 5 minutes
    const errorRate = recentErrors.length;
    const circuitBreakersOpen = Array.from(this.circuitBreakerStates.values())
      .filter(cb => cb.isOpen).length;

    if (circuitBreakersOpen > 0 || errorRate > 20) {
      return {
        status: 'unhealthy',
        response_time: undefined,
        last_check: new Date(),
        error_message: `High error rate (${errorRate}) or circuit breakers open (${circuitBreakersOpen})`,
        timestamp: new Date()
      };
    }

    if (errorRate > 10) {
      return {
        status: 'degraded',
        response_time: this.errorStats.averageRecoveryTime,
        last_check: new Date(),
        error_message: `Elevated error rate: ${errorRate} errors in last 5 minutes`,
        timestamp: new Date()
      };
    }

    return {
      status: 'healthy',
      response_time: this.errorStats.averageRecoveryTime,
      last_check: new Date(),
      timestamp: new Date()
    };
  }

  /**
   * Normalize any error to SeRankingError format
   */
  private normalizeError(error: unknown, context?: SeRankingErrorContext): SeRankingError {
    if (this.isSeRankingError(error)) {
      return error;
    }

    const normalizedError = new Error(
      error instanceof Error ? error.message : 'Unknown error'
    ) as SeRankingError;

    normalizedError.type = this.categorizeError(error);
    normalizedError.retryable = this.isRetryableError(normalizedError);
    normalizedError.context = context;
    normalizedError.timestamp = context?.timestamp || new Date();

    if (error instanceof Error) {
      normalizedError.stack = error.stack;
      normalizedError.originalError = error;
    }

    return normalizedError;
  }

  /**
   * Determine appropriate recovery strategy based on error type
   */
  private determineRecoveryStrategy(error: SeRankingError, context: SeRankingErrorContext): RecoveryStrategy {
    switch (error.type) {
      case SeRankingErrorType.RATE_LIMIT_ERROR:
        return 'retry';
      
      case SeRankingErrorType.NETWORK_ERROR:
      case SeRankingErrorType.TIMEOUT_ERROR:
        return 'circuit_breaker';
      
      case SeRankingErrorType.QUOTA_EXCEEDED_ERROR:
        return 'graceful_degradation';
      
      case SeRankingErrorType.AUTHENTICATION_ERROR:
        return 'fail_fast';
      
      case SeRankingErrorType.PARSING_ERROR:
        return 'fallback';
      
      case SeRankingErrorType.INVALID_REQUEST_ERROR:
        return 'fail_fast';
      
      default:
        return 'retry';
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    const baseDelay = this.config.baseRetryDelay;
    const multiplier = this.config.retryMultiplier;
    const maxDelay = this.config.maxRetryDelay;
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 + 0.85; // 85-115% of calculated delay
    
    const delay = Math.min(
      baseDelay * Math.pow(multiplier, attemptNumber) * jitter,
      maxDelay
    );
    
    return Math.round(delay);
  }

  /**
   * Check if error is SeRankingError
   */
  private isSeRankingError(error: unknown): error is SeRankingError {
    return error instanceof Error && 'type' in error && 'retryable' in error;
  }

  /**
   * Categorize error type based on error characteristics
   */
  private categorizeError(error: unknown): SeRankingErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return SeRankingErrorType.NETWORK_ERROR;
      }
      
      if (message.includes('timeout') || message.includes('aborted')) {
        return SeRankingErrorType.TIMEOUT_ERROR;
      }
      
      if (message.includes('rate limit') || message.includes('429')) {
        return SeRankingErrorType.RATE_LIMIT_ERROR;
      }
      
      if (message.includes('auth') || message.includes('401') || message.includes('403')) {
        return SeRankingErrorType.AUTHENTICATION_ERROR;
      }
      
      if (message.includes('quota') || message.includes('limit exceeded')) {
        return SeRankingErrorType.QUOTA_EXCEEDED_ERROR;
      }
      
      if (message.includes('parse') || message.includes('json') || message.includes('format')) {
        return SeRankingErrorType.PARSING_ERROR;
      }
      
      if (message.includes('invalid') || message.includes('400')) {
        return SeRankingErrorType.INVALID_REQUEST_ERROR;
      }
    }

    return SeRankingErrorType.UNKNOWN_ERROR;
  }

  /**
   * Record error in statistics
   */
  private recordError(error: SeRankingError, context: SeRankingErrorContext): void {
    this.errorStats.totalErrors++;
    const typeKey = String(error.type);
    this.errorStats.errorsByType[typeKey] = (this.errorStats.errorsByType[typeKey] || 0) + 1;
    this.errorStats.errorsByOperations[context.operation] = 
      (this.errorStats.errorsByOperations[context.operation] || 0) + 1;
    
    this.errorStats.lastError = {
      type: typeKey,
      message: error.message,
      timestamp: new Date(),
      context
    };

    this.errorHistory.push({
      error,
      context,
      timestamp: new Date()
    });

    // Keep only recent history
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-500);
    }
  }

  /**
   * Record successful recovery
   */
  private recordSuccessfulRecovery(attempts: number, recoveryTime: number): void {
    this.errorStats.successfulRecoveries++;
    
    // Update average recovery time
    const totalRecoveries = this.errorStats.successfulRecoveries + this.errorStats.failedRecoveries;
    this.errorStats.averageRecoveryTime = 
      (this.errorStats.averageRecoveryTime * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
  }

  /**
   * Record failed recovery
   */
  private recordFailedRecovery(attempts: number, recoveryTime: number): void {
    this.errorStats.failedRecoveries++;
    
    // Update average recovery time
    const totalRecoveries = this.errorStats.successfulRecoveries + this.errorStats.failedRecoveries;
    this.errorStats.averageRecoveryTime = 
      (this.errorStats.averageRecoveryTime * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
  }

  /**
   * Get circuit breaker key for context
   */
  private getCircuitBreakerKey(context?: SeRankingErrorContext): string {
    return `${context?.operation || 'default'}-${context?.apiEndpoint || 'general'}`;
  }

  /**
   * Get circuit breaker state
   */
  private getCircuitBreakerState(key: string): CircuitBreakerState {
    if (!this.circuitBreakerStates.has(key)) {
      this.circuitBreakerStates.set(key, {
        isOpen: false,
        failureCount: 0
      });
    }
    return this.circuitBreakerStates.get(key)!;
  }

  /**
   * Create circuit breaker error
   */
  private createCircuitBreakerError(breaker: CircuitBreakerState, context?: SeRankingErrorContext): SeRankingError {
    const error = new Error('Circuit breaker is open') as SeRankingError;
    error.type = SeRankingErrorType.NETWORK_ERROR;
    error.retryable = false;
    error.context = context;
    return error;
  }

  /**
   * Generate fallback data based on context
   */
  private async generateFallbackData<T>(context?: SeRankingErrorContext): Promise<T | undefined> {
    if (!context || !context.operation) {
      return undefined;
    }

    // Return empty/default data structures based on operation type
    switch (context.operation) {
      case 'fetchKeywordData':
        return [] as T;
      
      case 'getKeywordData':
        return null as T;
      
      case 'queryKeywordData':
        return { data: [], total: 0, has_more: false } as any;
      
      default:
        return undefined;
    }
  }

  /**
   * Generate degraded response
   */
  private generateDegradedResponse<T>(context?: SeRankingErrorContext): T | undefined {
    // Similar to fallback but indicates degraded service
    if (!context || !context.operation) {
      return undefined;
    }

    // Return empty/default data structures based on operation type
    switch (context.operation) {
      case 'fetchKeywordData':
        return [] as T;
      
      case 'getKeywordData':
        return null as T;
      
      case 'queryKeywordData':
        return { data: [], total: 0, has_more: false } as any;
      
      default:
        return undefined;
    }
  }

  /**
   * Get recent errors within time window
   */
  private getRecentErrors(timeWindowMs: number): Array<{error: any; context: any; timestamp: Date}> {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.errorHistory.filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Log error based on configuration (internal)
   */
  private logErrorInternal(error?: any, context?: any, prefix: string = ''): void {
    if (!error) return;

    const severity = this.getErrorSeverity(error);
    const logMessage = [
      prefix,
      `[${error.type}]`,
      error.message,
      context ? `(${context.operation})` : '',
    ].filter(Boolean).join(' ');

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error({ error: error.message, context, severity: 'CRITICAL' }, `🔥 CRITICAL: ${logMessage}`);
        break;
      
      case ErrorSeverity.HIGH:
        logger.error({ error: error.message, context, severity: 'HIGH' }, `❌ ERROR: ${logMessage}`);
        break;
      
      case ErrorSeverity.MEDIUM:
        logger.warn({ error: error.message, context, severity: 'MEDIUM' }, `⚠️  WARNING: ${logMessage}`);
        break;
      
      case ErrorSeverity.LOW:
        logger.info({ error: error.message, context, severity: 'LOW' }, `ℹ️  INFO: ${logMessage}`);
        break;
    }
  }

  /**
   * Get error severity
   */
  private getErrorSeverity(error: any): ErrorSeverity {
    switch (error.type) {
      case SeRankingErrorType.AUTHENTICATION_ERROR:
        return ErrorSeverity.CRITICAL;
      
      case SeRankingErrorType.QUOTA_EXCEEDED_ERROR:
        return ErrorSeverity.HIGH;
      
      case SeRankingErrorType.RATE_LIMIT_ERROR:
      case SeRankingErrorType.NETWORK_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case SeRankingErrorType.TIMEOUT_ERROR:
      case SeRankingErrorType.PARSING_ERROR:
        return ErrorSeverity.LOW;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ISeRankingErrorHandler implementation: Handle API errors with recovery strategies
   */
  async handleApiError(error: any, context?: any): Promise<ServiceResponse<any>> {
    const recoveryResult = await this.handleError(error, {
      operation: context?.operation || 'unknown_api_call',
      timestamp: new Date(),
      ...context
    });

    if (recoveryResult.success) {
      return {
        success: true,
        data: recoveryResult.data,
        metadata: {
          source: recoveryResult.fallbackUsed ? 'cache' : 'api',
          timestamp: new Date()
        }
      };
    }

    return {
      success: false,
      error: {
        type: recoveryResult.error?.type || SeRankingErrorType.UNKNOWN_ERROR,
        message: recoveryResult.error?.message || 'API error occurred',
        details: recoveryResult.error?.context
      }
    };
  }

  /**
   * ISeRankingErrorHandler implementation: Handle enrichment errors
   */
  async handleEnrichmentError(error: any, keyword: string, countryCode: string): Promise<void> {
    await this.handleError(error, {
      operation: 'keyword_enrichment',
      timestamp: new Date(),
      keywords: [keyword],
      countryCode
    });
  }

  /**
   * ISeRankingErrorHandler implementation: Check if error is retryable
   */
  isRetryableError(error: any): boolean {
    const normalized = this.normalizeError(error);
    return normalized.retryable !== false && [
      SeRankingErrorType.NETWORK_ERROR,
      SeRankingErrorType.TIMEOUT_ERROR,
      SeRankingErrorType.RATE_LIMIT_ERROR,
      SeRankingErrorType.UNKNOWN_ERROR
    ].includes(normalized.type);
  }

  /**
   * ISeRankingErrorHandler implementation: Get retry delay for error
   */
  getRetryDelay(error: any, attemptNumber: number): number {
    return this.calculateBackoffDelay(attemptNumber);
  }

  /**
   * ISeRankingErrorHandler implementation: Log error with context
   */
  async logError(error: any, context?: any): Promise<void> {
    this.logErrorInternal(error, context);
  }

  /**
   * Create default error handling configuration
   */
  static createDefaultConfig(): ErrorHandlingConfig {
    return {
      maxRetryAttempts: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      retryMultiplier: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      enableGracefulDegradation: true,
      logLevel: 'error'
    };
  }
}
