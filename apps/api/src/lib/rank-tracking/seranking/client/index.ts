/**
 * SeRanking Client Layer
 * Barrel exports for all client components
 */

// Main API client
export { SeRankingApiClient, SeRankingApiError } from './SeRankingApiClient';

// Request builder utilities
export { ApiRequestBuilder } from './ApiRequestBuilder';

// Rate limiting functionality
export { RateLimiter } from './RateLimiter';

// Re-export types from shared package
export type {
  SeRankingClientConfig,
  ApiRequestConfig,
  SeRankingRateLimitConfig as RateLimitConfig,
  RateLimitState
} from '@indexnow/shared';
