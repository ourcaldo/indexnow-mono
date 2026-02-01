/**
 * SeRanking Services Module
 * Central export file for all SeRanking integration services
 */

import { 
  IEnrichmentQueue, 
  IKeywordEnrichmentService, 
  ISeRankingErrorHandler 
} from '@indexnow/shared';

// Main Service Facade (PRIMARY ENTRY POINT)
import { SeRankingService, createSeRankingService, seRankingService } from './SeRankingService';
export { SeRankingService, createSeRankingService, seRankingService };
export type { 
  SeRankingServiceConfig,
  SystemStatus,
  KeywordIntelligenceResult,
  BulkEnrichmentResult
} from './SeRankingService';

// Core services
import { KeywordEnrichmentService } from './KeywordEnrichmentService';
export { KeywordEnrichmentService };
export type { KeywordEnrichmentConfig } from './KeywordEnrichmentService';

// Queue and processing services
import { EnrichmentQueue } from './EnrichmentQueue';
export { EnrichmentQueue };
export type { QueueConfig } from './EnrichmentQueue';

import { JobProcessor } from './JobProcessor';
export { JobProcessor };
export type { ProcessorConfig } from './JobProcessor';

import { EnrichmentOrchestrator } from './EnrichmentOrchestrator';
export { EnrichmentOrchestrator };

import { ErrorHandlingService } from './ErrorHandlingService';
export { ErrorHandlingService };
export type { ErrorHandlingConfig } from './ErrorHandlingService';

import { KeywordBankService } from './KeywordBankService';
export { KeywordBankService };

import { IntegrationService } from './IntegrationService';
export { IntegrationService };
export type { 
  IntegrationServiceConfig,
  UsageReport
} from './IntegrationService';

import { ValidationService } from './ValidationService';
export { ValidationService };
export type { ValidationResult, ValidationError, ValidationWarning } from './ValidationService';

import { ApiMetricsCollector } from './ApiMetricsCollector';
export { ApiMetricsCollector };
export type { ApiMetricsConfig } from './ApiMetricsCollector';

import { QuotaMonitor } from './QuotaMonitor';
export { QuotaMonitor };
export type { QuotaMonitorConfig } from './QuotaMonitor';

import { HealthChecker } from './HealthChecker';
export { HealthChecker };
export type { HealthCheckConfig } from './HealthChecker';

// Export types from shared package
export * from '@indexnow/shared';

// Re-export client
export { SeRankingApiClient } from '../client/SeRankingApiClient';

// SIMPLIFIED FACTORY FUNCTIONS

/**
 * Create main SeRanking service with default configuration
 * This is the recommended way to use the SeRanking integration
 */
export function createSeRankingServiceWithDefaults(apiKey: string) {
  return createSeRankingService({
    apiKey,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 50000
    },
    monitoring: {
      enableMetrics: true,
      enableAlerts: true,
      quotaWarningThreshold: 0.8,
      quotaCriticalThreshold: 0.95,
      metricsRetentionDays: 30
    },
    queue: {
      maxQueueSize: 10000,
      batchSize: 25,
      maxConcurrentJobs: 3,
      processingTimeout: 300000
    },
    logging: {
      level: 'info',
      enableDetailedLogging: false
    }
  });
}

// Legacy utility functions for backward compatibility
export function createEnrichmentOrchestrator(config: any = {}) {
  return new EnrichmentOrchestrator(config);
}

export function createEnrichmentQueue(config: any = {}) {
  return new EnrichmentQueue(config);
}

export function createJobProcessor(
  queue: IEnrichmentQueue,
  enrichmentService: IKeywordEnrichmentService,
  errorHandler: ISeRankingErrorHandler,
  config: any = {}
) {
  return new JobProcessor(queue, enrichmentService, errorHandler, config);
}
