/**
 * Service Interface Type Definitions
 * Service contracts and interfaces for SeRanking integration
 */

import { type Json } from '../common/Json';

import {
  SeRankingApiResponse,
  ServiceResponse,
  BulkProcessingJob,
  QuotaStatus,
  EnhancedQuotaStatus,
  ApiMetrics,
  PerformanceAnalysis,
  SeRankingHealthCheckResult,
  SystemHealthSummary,
  SeRankingErrorContext,
  RecoveryResult,
  SeRankingError,
} from './SeRankingTypes';

import {
  KeywordBankEntity,
  KeywordBankInsert,
  KeywordBankQuery,
  KeywordBankQueryResult,
  KeywordBankOperationResult,
  BulkKeywordBankOperationResult,
  KeywordBankCacheStats,
} from './KeywordBankTypes';

import { 
  EnrichmentJob, 
  JobProgress, 
  JobError, 
  EnrichmentJobStatus,
  QueueStats,
  QueueOperationResponse 
} from './EnrichmentJobTypes';

// SeRanking API Client Interface
export interface ISeRankingApiClient {
  fetchKeywordData(keywords: string[], countryCode: string): Promise<SeRankingApiResponse>;
  testConnection(): Promise<SeRankingHealthCheckResult>;
  getQuotaStatus(): Promise<QuotaStatus>;
  isHealthy(): Promise<boolean>;
}

// Rate Limiter Interface
export interface IRateLimiter {
  isAllowed(): Promise<boolean>;
  recordRequest(): Promise<void>;
  getStatus(): Promise<{
    remaining: { minute: number; hour: number; day: number };
    resetTime: { minute: Date; hour: Date; day: Date };
  }>;
  reset(): Promise<void>;
}

// Keyword Bank Service Interface
export interface IKeywordBankService {
  getKeywordData(keyword: string, countryCode: string): Promise<KeywordBankEntity | null>;
  upsertKeywordData(data: KeywordBankInsert): Promise<KeywordBankOperationResult>;
  bulkUpsertKeywordData(data: KeywordBankInsert[]): Promise<BulkKeywordBankOperationResult>;
  searchKeywords(query: KeywordBankQuery): Promise<KeywordBankQueryResult>;
  getStaleKeywords(olderThanDays: number, limit?: number): Promise<KeywordBankEntity[]>;
  deleteKeywordData(keyword: string, countryCode: string): Promise<KeywordBankOperationResult>;
  getBankStats(): Promise<{
    total_keywords: number;
    with_data: number;
    without_data: number;
    average_age_days: number;
  }>;
  getCacheStats(): Promise<KeywordBankCacheStats>;
}

// Keyword Enrichment Service Interface
export interface IKeywordEnrichmentService {
  enrichKeyword(keyword: string, countryCode: string, forceRefresh?: boolean): Promise<ServiceResponse<KeywordBankEntity>>;
  enrichKeywordsBulk(keywords: Array<{keyword: string; countryCode: string}>): Promise<ServiceResponse<BulkProcessingJob>>;
  getJobStatus(jobId: string): Promise<ServiceResponse<BulkProcessingJob>>;
  cancelJob(jobId: string): Promise<ServiceResponse<boolean>>;
  retryFailedEnrichments(jobId: string): Promise<ServiceResponse<BulkProcessingJob>>;
}

// Integration Service Interface
export interface IIntegrationService {
  getIntegrationSettings(userId?: string): Promise<ServiceResponse<{
    service_name: string;
    api_key: string;
    api_url: string;
    api_quota_limit: number;
    api_quota_used: number;
    quota_reset_date: Date;
    is_active: boolean;
  }>>;
  updateIntegrationSettings(settings: {
    api_quota_limit?: number;
    is_active?: boolean;
  }): Promise<ServiceResponse<boolean>>;
  recordApiUsage(requestCount?: number): Promise<ServiceResponse<boolean>>;
  resetQuotaUsage(): Promise<ServiceResponse<boolean>>;
  testIntegration(): Promise<ServiceResponse<SeRankingHealthCheckResult>>;
  getQuotaStatus(): Promise<ServiceResponse<QuotaStatus>>;
}

// Validation Service Interfaces
export interface IKeywordValidator {
  validateKeywordInput(keyword: string, countryCode: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized: {keyword: string; countryCode: string};
  }>;
  validateBulkKeywords(keywords: Array<{keyword: string; countryCode: string}>): Promise<{
    valid: Array<{keyword: string; countryCode: string}>;
    invalid: Array<{keyword: string; countryCode: string; errors: string[]}>;
    totalValid: number;
    totalInvalid: number;
  }>;
}

export interface IApiResponseValidator {
  validateApiResponse(response: Json): Promise<{
    isValid: boolean;
    data: Json[];
    errors: string[];
    warnings: string[];
  }>;
  sanitizeResponseData(data: Json): Json[];
}

export interface IQuotaValidator {
  checkQuotaAvailability(requestCount?: number): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }>;
  recordApiUsage(requestCount?: number): Promise<void>;
  getQuotaStatus(): Promise<QuotaStatus>;
}

// Error Handling Service Interface
export interface ISeRankingErrorHandler {
  handleError<T>(
    error: Error,
    context: SeRankingErrorContext,
    recoveryFunction?: () => Promise<T>
  ): Promise<RecoveryResult<T>>;
  handleApiError(error: unknown, context?: SeRankingErrorContext): Promise<ServiceResponse<Json>>;
  handleEnrichmentError(error: unknown, keyword: string, countryCode: string): Promise<void>;
  isRetryableError(error: unknown): boolean;
  getRetryDelay(error: unknown, attemptNumber: number): number;
  logError(error: SeRankingError, context?: SeRankingErrorContext): Promise<void>;
}

// Monitoring Service Interfaces
export interface IApiMetricsCollector {
  recordApiCall(
    duration: number, 
    status: 'success' | 'error',
    metadata?: Record<string, Json>
  ): Promise<void>;
  recordCacheHit(duration: number): Promise<void>;
  recordCacheMiss(): Promise<void>;
  getMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month'): Promise<ApiMetrics>;
  getPerformanceAnalysis(timeRange?: 'day' | 'week' | 'month'): Promise<PerformanceAnalysis>;
  resetMetrics(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface IQuotaMonitor {
  checkQuotaAlerts(): Promise<void>;
  setAlertThresholds(thresholds: number[]): Promise<void>;
  recordQuotaUsage(quotaConsumed: number, metadata?: Record<string, Json>): Promise<void>;
  getUsageHistory(startDate?: Date, endDate?: Date, days?: number): Promise<Json[]>;
  getEnhancedQuotaStatus(): Promise<ServiceResponse<EnhancedQuotaStatus>>;
  shutdown(): Promise<void>;
}

export interface IHealthChecker {
  performHealthCheck(): Promise<SeRankingHealthCheckResult>;
  checkApiHealth(): Promise<SeRankingHealthCheckResult>;
  checkDatabaseHealth(): Promise<SeRankingHealthCheckResult>;
  checkCacheHealth(): Promise<SeRankingHealthCheckResult>;
  getSystemHealthSummary(): Promise<SystemHealthSummary>;
  shutdown(): Promise<void>;
}

// Queue Service Interfaces
export interface IEnrichmentQueue {
  enqueue(keywords: Array<{keyword: string; countryCode: string}>, priority?: 'high' | 'normal' | 'low'): Promise<string>;
  dequeueJob(workerId: string): Promise<EnrichmentJob | null>;
  getJobStatus(jobId: string, userId?: string): Promise<{
    success: boolean;
    job?: EnrichmentJob;
    error?: string;
  }>;
  updateJobProgress(jobId: string, progress: Partial<JobProgress>): Promise<boolean>;
  completeJob(jobId: string, result: Json, status?: EnrichmentJobStatus): Promise<boolean>;
  failJob(jobId: string, error: JobError, shouldRetry?: boolean): Promise<boolean>;
  getQueueStatus(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;
  getQueueStats(): Promise<QueueStats>;
  pauseQueue(): Promise<QueueOperationResponse>;
  resumeQueue(): Promise<QueueOperationResponse>;
  shutdown(): Promise<void>;
}

export interface IJobProcessor {
  processEnrichmentJob(jobId: string): Promise<BulkProcessingJob>;
  processKeywordEnrichment(keyword: string, countryCode: string): Promise<ServiceResponse<KeywordBankEntity>>;
  shutdown(): Promise<void>;
}

// Facade Interface for Main Service
export interface ISeRankingService {
  enrichment: IKeywordEnrichmentService;
  keywordBank: IKeywordBankService;
  integration: IIntegrationService;
  validation: {
    keyword: IKeywordValidator;
    response: IApiResponseValidator;
    quota: IQuotaValidator;
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
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): Promise<{
    isInitialized: boolean;
    isHealthy: boolean;
    services: Record<string, boolean>;
  }>;
}
