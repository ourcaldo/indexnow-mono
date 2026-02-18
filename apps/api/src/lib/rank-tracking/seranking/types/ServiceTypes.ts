/**
 * Service Interface Type Definitions
 * Service contracts and interfaces for SeRanking integration
 */

import {
  SeRankingKeywordData,
  SeRankingApiResponse,
  ServiceResponse,
  BulkProcessingJob,
  QuotaStatus,
  ApiMetrics,
  HealthCheckResult,
  SeRankingError,
} from './SeRankingTypes';

/** Queue statistics (not yet in SeRankingTypes — defined locally) */
export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

import {
  KeywordBankEntity,
  KeywordBankInsert,
  KeywordBankQuery,
  KeywordBankQueryResult,
  KeywordBankOperationResult,
  BulkKeywordBankOperationResult
} from './KeywordBankTypes';

// SeRanking API Client Interface
export interface ISeRankingApiClient {
  /**
   * Fetch keyword data from SeRanking API
   */
  fetchKeywordData(keywords: string[], countryCode: string): Promise<SeRankingApiResponse>;
  
  /**
   * Test API connection and authentication
   */
  testConnection(): Promise<HealthCheckResult>;
  
  /**
   * Get current API quota status
   */
  getQuotaStatus(): Promise<QuotaStatus>;
  
  /**
   * Check if API is healthy
   */
  isHealthy(): Promise<boolean>;
}

// Rate Limiter Interface
export interface IRateLimiter {
  /**
   * Check if request is allowed under rate limits
   */
  isAllowed(): Promise<boolean>;
  
  /**
   * Record a successful API request
   */
  recordRequest(): Promise<void>;
  
  /**
   * Get current rate limit status
   */
  getStatus(): Promise<{
    remaining: { minute: number; hour: number; day: number };
    resetTime: { minute: Date; hour: Date; day: Date };
  }>;
  
  /**
   * Reset rate limit counters
   */
  reset(): Promise<void>;
}

// Keyword Bank Service Interface
export interface IKeywordBankService {
  /**
   * Get keyword data from bank
   */
  getKeywordData(keyword: string, countryCode: string): Promise<KeywordBankEntity | null>;
  
  /**
   * Insert or update keyword data in bank
   */
  upsertKeywordData(data: KeywordBankInsert): Promise<KeywordBankOperationResult>;
  
  /**
   * Bulk upsert keyword data
   */
  bulkUpsertKeywordData(data: KeywordBankInsert[]): Promise<BulkKeywordBankOperationResult>;
  
  /**
   * Search keyword bank with filters
   */
  searchKeywords(query: KeywordBankQuery): Promise<KeywordBankQueryResult>;
  
  /**
   * Get keywords that need refresh
   */
  getStaleKeywords(olderThanDays: number, limit?: number): Promise<KeywordBankEntity[]>;
  
  /**
   * Delete keyword data from bank
   */
  deleteKeywordData(keyword: string, countryCode: string): Promise<KeywordBankOperationResult>;
  
  /**
   * Get bank statistics
   */
  getBankStats(): Promise<{
    total_keywords: number;
    with_data: number;
    without_data: number;
    average_age_days: number;
  }>;
}

// Keyword Enrichment Service Interface
export interface IKeywordEnrichmentService {
  /**
   * Enrich single keyword with intelligence data
   */
  enrichKeyword(keyword: string, countryCode: string, forceRefresh?: boolean): Promise<ServiceResponse<KeywordBankEntity>>;
  
  /**
   * Enrich multiple keywords (queue-based)
   */
  enrichKeywordsBulk(keywords: Array<{keyword: string; countryCode: string}>): Promise<ServiceResponse<BulkProcessingJob>>;
  
  /**
   * Get enrichment job status
   */
  getJobStatus(jobId: string): Promise<ServiceResponse<BulkProcessingJob>>;
  
  /**
   * Cancel enrichment job
   */
  cancelJob(jobId: string): Promise<ServiceResponse<boolean>>;
  
  /**
   * Retry failed keyword enrichments
   */
  retryFailedEnrichments(jobId: string): Promise<ServiceResponse<BulkProcessingJob>>;
}

// Integration Service Interface
export interface IIntegrationService {
  /**
   * Get SeRanking integration settings
   */
  getIntegrationSettings(userId?: string): Promise<ServiceResponse<{
    service_name: string;
    api_key: string;
    api_url: string;
    api_quota_limit: number;
    api_quota_used: number;
    quota_reset_date: Date;
    is_active: boolean;
  }>>;
  
  /**
   * Update integration settings
   */
  updateIntegrationSettings(settings: {
    api_quota_limit?: number;
    is_active?: boolean;
  }): Promise<ServiceResponse<boolean>>;
  
  /**
   * Record API usage
   */
  recordApiUsage(requestCount?: number): Promise<ServiceResponse<boolean>>;
  
  /**
   * Reset quota usage
   */
  resetQuotaUsage(): Promise<ServiceResponse<boolean>>;
  
  /**
   * Test integration health
   */
  testIntegration(): Promise<ServiceResponse<HealthCheckResult>>;
  
  /**
   * Get quota status
   */
  getQuotaStatus(): Promise<ServiceResponse<QuotaStatus>>;
}

// Validation Service Interfaces
export interface IKeywordValidator {
  /**
   * Validate keyword input
   */
  validateKeywordInput(keyword: string, countryCode: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized: {keyword: string; countryCode: string};
  };
  
  /**
   * Validate bulk keyword input
   */
  validateKeywordsBatch(keywords: string[]): {
    isValid: boolean;
    errors: string[];
  };
}

export interface IApiResponseValidator {
  /**
   * Validate SeRanking API response
   */
  validateApiResponse(response: unknown): {
    isValid: boolean;
    data: SeRankingKeywordData[];
    errors: string[];
    warnings: string[];
  };
  
  /**
   * Sanitize and fix API response data
   */
  sanitizeResponseData(data: unknown): SeRankingKeywordData[];
}

export interface IQuotaValidator {
  /**
   * Check if quota allows for request
   */
  checkQuotaAvailability(requestCount?: number): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }>;
  
  /**
   * Record quota usage
   */
  recordApiUsage(requestCount?: number): Promise<void>;
  
  /**
   * Get quota status
   */
  getQuotaStatus(): Promise<QuotaStatus>;
}

// Error Handling Service Interface
export interface ISeRankingErrorHandler {
  /**
   * Handle API errors with recovery strategies
   */
  handleError<T>(error: unknown, context?: unknown): Promise<ServiceResponse<T>>;
  
  /**
   * Check if error is retryable
   */
  isRetryableError(error: unknown): boolean;
  
  /**
   * Get retry delay for error
   */
  getRetryDelay(error: unknown, attemptNumber: number): number;
  
  /**
   * Log error with context
   */
  logError(error: SeRankingError | unknown, context?: unknown): Promise<void>;
}

// Monitoring Service Interfaces
export interface IApiMetricsCollector {
  /**
   * Record successful API call
   */
  recordApiCall(duration: number, status: 'success' | 'error'): Promise<void>;
  
  /**
   * Record cache hit
   */
  recordCacheHit(duration: number): Promise<void>;
  
  /**
   * Record cache miss
   */
  recordCacheMiss(): Promise<void>;
  
  /**
   * Get API metrics
   */
  getMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month'): Promise<ApiMetrics>;
  
  /**
   * Reset metrics
   */
  resetMetrics(): Promise<void>;
}

export interface IQuotaMonitor {
  /**
   * Monitor quota usage and send alerts
   */
  checkQuotaAlerts(): Promise<void>;
  
  /**
   * Set quota alert thresholds
   */
  setAlertThresholds(thresholds: unknown): Promise<void>;
  
  /**
   * Get quota usage history
   */
  getUsageHistory(days?: number): Promise<Array<{
    date: string;
    usage: number;
    percentage: number;
  }>>;
  
  /**
   * Shutdown the monitor
   */
  shutdown?(): Promise<void>;
}

export interface IHealthChecker {
  /**
   * Perform comprehensive health check
   */
  performHealthCheck(): Promise<HealthCheckResult>;
  
  /**
   * Shutdown the checker
   */
  shutdown?(): Promise<void>;
}

// Queue Service Interfaces
export interface IEnrichmentQueue {
  /**
   * Add keywords to enrichment queue
   */
  enqueue(keywords: Array<{keyword: string; countryCode: string}>, priority?: 'high' | 'normal' | 'low'): Promise<string>;
  
  /**
   * Get queue status
   */
  getQueueStatus(): Promise<{
    processing: number;
  }>;
  
  /**
   * Get queue stats
   */
  getQueueStats(): Promise<QueueStats>;

  /**
   * Shutdown the queue
   */
  shutdown?(): Promise<void>;
}

export interface IJobProcessor {
  /**
   * Process enrichment job
   */
  processEnrichmentJob(jobId: string): Promise<BulkProcessingJob>;

  /**
   * Shutdown the processor
   */
  shutdown?(): Promise<void>;
}

// Facade Interface for Main Service
export interface ISeRankingService {
  // Delegation to sub-services
  enrichment: IKeywordEnrichmentService;
  keywordBank: IKeywordBankService;
  integration: IIntegrationService;
  validation: {
    keyword: IKeywordValidator;
    response: IApiResponseValidator;
    quota: IIntegrationService;
  };
  monitoring: {
    metrics: IApiMetricsCollector;
    quota: IQuotaMonitor;
    health: IHealthChecker;
  };
  queue: {
    enrichment: IEnrichmentQueue;
    processor: IJobProcessor;
  };
  
  // Main service methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): Promise<unknown>;
}
