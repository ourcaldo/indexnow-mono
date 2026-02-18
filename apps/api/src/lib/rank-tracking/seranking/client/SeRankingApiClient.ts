/**
 * SeRanking API Client
 * HTTP client for SeRanking keyword export API with authentication and error handling
 */

import {
  SeRankingClientConfig,
  SeRankingApiResponse,
  SeRankingError as ISeRankingError,
  SeRankingErrorType,
  HealthCheckResult,
  QuotaStatus,
  ApiRequestConfig,
} from '../types/SeRankingTypes';
import { RateLimiter } from './RateLimiter';
import { ApiRequestBuilder } from './ApiRequestBuilder';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { sleep } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';

export class SeRankingApiClient {
  private config: SeRankingClientConfig;
  private rateLimiter: RateLimiter;
  private lastHealthCheck?: HealthCheckResult;
  private lastHealthCheckTime?: Date;
  private integrationApiKey?: string;
  private integrationApiKeyExpiry?: Date;

  constructor(config: SeRankingClientConfig, rateLimiter?: RateLimiter) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retryAttempts: 3,
      retryDelay: 1000, // 1 second default
      ...config,
    };

    // Initialize rate limiter with default config if not provided
    this.rateLimiter = rateLimiter || new RateLimiter(RateLimiter.createDefaultConfig());
  }

  /**
   * Fetch keyword data from SeRanking API
   */
  async fetchKeywordData(keywords: string[], countryCode: string): Promise<SeRankingApiResponse> {
    // Check rate limiting before making request
    await this.rateLimiter.waitForAvailability(keywords.length);

    try {
      // Get actual API key from database
      const actualApiKey = await this.getActualApiKey();
      if (!actualApiKey) {
        throw new SeRankingApiError(
          'No SeRanking API key found in integration settings',
          SeRankingErrorType.AUTHENTICATION_ERROR,
          { statusCode: 401, retryable: false }
        );
      }

      // Create a new request builder with the actual API key
      const requestBuilder = new ApiRequestBuilder(this.config.baseUrl, actualApiKey);

      // Use ApiRequestBuilder to build request configuration
      const requestConfig = requestBuilder.buildKeywordExportRequest(keywords, countryCode, {
        sort: 'cpc',
        sortOrder: 'desc',
        columns: ['keyword', 'volume', 'cpc', 'competition', 'difficulty', 'history_trend'],
      });

      const response = await this.makeRequest(requestConfig);

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      const data = await response.json();

      // Log raw API response for debugging (do not log API key)
      logger.info(
        {
          keywords: keywords.join(', '),
          countryCode,
          status: response.status,
          statusText: response.statusText,
        },
        `SeRanking API Raw Response for keywords: ${keywords.join(', ')} (${countryCode})`
      );

      const result = this.validateAndTransformResponse(data);

      // Record successful request in rate limiter
      await this.rateLimiter.recordRequest(keywords.length);

      return result;
    } catch (error) {
      if (error instanceof SeRankingApiError) {
        throw error;
      }
      throw this.createGenericError(error);
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(countryCode: string = 'us'): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Get actual API key from database
      const actualApiKey = await this.getActualApiKey();
      if (!actualApiKey) {
        this.lastHealthCheck = {
          status: 'unhealthy',
          response_time: Date.now() - startTime,
          last_check: new Date(),
          error_message: 'No SeRanking API key found in integration settings',
        };
        return this.lastHealthCheck;
      }

      // Create a new request builder with the actual API key
      const requestBuilder = new ApiRequestBuilder(this.config.baseUrl, actualApiKey);

      // Use ApiRequestBuilder for health check request with dynamic country
      const requestConfig = requestBuilder.buildHealthCheckRequest(countryCode);
      const response = await this.makeRequest(requestConfig);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.lastHealthCheck = {
          status: 'healthy',
          response_time: responseTime,
          last_check: new Date(),
        };
      } else {
        const error = await this.createApiError(response);
        this.lastHealthCheck = {
          status: error.type === SeRankingErrorType.AUTHENTICATION_ERROR ? 'unhealthy' : 'degraded',
          response_time: responseTime,
          last_check: new Date(),
          error_message: error.message,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.lastHealthCheck = {
        status:
          error instanceof SeRankingApiError &&
          error.type === SeRankingErrorType.AUTHENTICATION_ERROR
            ? 'unhealthy'
            : 'degraded',
        response_time: responseTime,
        last_check: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    this.lastHealthCheckTime = new Date();
    return this.lastHealthCheck;
  }

  /**
   * Get current API quota status
   */
  async getQuotaStatus(): Promise<QuotaStatus> {
    return {
      total: 0,
      used: 0,
      remaining: 0,
      resetDate: new Date().toISOString(),
      isExceeded: false,
    } as unknown as QuotaStatus;
  }

  /**
   * Check if API is healthy (cached for 5 minutes)
   */
  async isHealthy(): Promise<boolean> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Use cached health check if recent
    if (
      this.lastHealthCheckTime &&
      this.lastHealthCheckTime > fiveMinutesAgo &&
      this.lastHealthCheck
    ) {
      return this.lastHealthCheck.status === 'healthy';
    }

    // Perform new health check
    const healthCheck = await this.testConnection();
    return healthCheck.status === 'healthy';
  }

  /**
   * Make HTTP request with timeout and enhanced retry logic for rate limiting
   */
  private async makeRequest(config: ApiRequestConfig): Promise<Response> {
    // Validate request configuration
    ApiRequestBuilder.validateRequestConfig(config);

    let lastError: unknown;

    for (let attempt = 0; attempt < (this.config.retryAttempts || 3); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          config.timeout || this.config.timeout
        );

        const response = await fetch(config.endpoint, {
          method: config.method,
          headers: config.headers,
          body: config.body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle successful responses
        if (response.ok) {
          return response;
        }

        // Handle rate limiting (429) with special retry logic
        if (response.status === 429) {
          if (attempt < (this.config.retryAttempts || 3) - 1) {
            const retryAfter = this.parseRetryAfterHeader(response);
            const jitter = Math.random() * 1000; // Add jitter up to 1 second
            const delay =
              retryAfter > 0
                ? retryAfter * 1000 + jitter
                : this.calculateExponentialBackoff(attempt) + jitter;

            logger.warn(
              {
                delay: Math.round(delay),
                attempt: attempt + 1,
                maxAttempts: this.config.retryAttempts,
              },
              `Rate limited (429), retrying after ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`
            );
            await sleep(delay);
            continue;
          }
        }

        // Handle server errors (5xx) with exponential backoff
        if (response.status >= 500) {
          if (attempt < (this.config.retryAttempts || 3) - 1) {
            const delay = this.calculateExponentialBackoff(attempt);
            logger.warn(
              {
                status: response.status,
                delay,
                attempt: attempt + 1,
                maxAttempts: this.config.retryAttempts,
              },
              `Server error (${response.status}), retrying after ${delay}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`
            );
            await sleep(delay);
            continue;
          }
        }

        // Don't retry client errors (4xx except 429) - return immediately
        return response;
      } catch (error) {
        lastError = error;

        // Don't retry on abort (timeout) or network errors if this is the last attempt
        if (attempt >= (this.config.retryAttempts || 3) - 1) {
          throw error;
        }

        // Retry network errors with exponential backoff
        const delay = this.calculateExponentialBackoff(attempt);
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(
          {
            delay,
            attempt: attempt + 1,
            maxAttempts: this.config.retryAttempts,
            error: errorMessage,
          },
          `Network error, retrying after ${delay}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`
        );
        await sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Validate and transform API response
   */
  private validateAndTransformResponse(data: unknown): SeRankingApiResponse {
    if (!Array.isArray(data)) {
      throw new SeRankingApiError(
        'Invalid API response format: expected array',
        SeRankingErrorType.PARSING_ERROR,
        { retryable: false }
      );
    }

    return data.map((item: Record<string, unknown>) => ({
      is_data_found: Boolean(item.is_data_found),
      keyword: String(item.keyword || ''),
      volume: item.volume ? Number(item.volume) : null,
      cpc: item.cpc ? Number(item.cpc) : null,
      competition: item.competition ? Number(item.competition) : null,
      difficulty: item.difficulty ? Number(item.difficulty) : null,
      history_trend:
        item.history_trend && typeof item.history_trend === 'object'
          ? (item.history_trend as Record<string, number> | null)
          : null,
    }));
  }

  /**
   * Create SeRanking API error from HTTP response with enhanced rate limit handling
   */
  private async createApiError(response: Response): Promise<SeRankingApiError> {
    let errorData: unknown;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        /* Invalid JSON — use raw text */
        errorData = { message: text };
      }
    } catch {
      /* Could not read response body */
      errorData = { message: response.statusText };
    }

    // Log error details for debugging
    logger.warn(
      {
        status: response.status,
        statusText: response.statusText,
        errorData,
      },
      `SeRanking API Error: ${response.status} ${response.statusText}`
    );

    let errorType: SeRankingErrorType;
    let retryable = false;

    switch (response.status) {
      case 401:
        errorType = SeRankingErrorType.AUTHENTICATION_ERROR;
        break;
      case 429:
        errorType = SeRankingErrorType.RATE_LIMIT_ERROR;
        retryable = true;
        break;
      case 402:
      case 403:
        errorType = SeRankingErrorType.QUOTA_EXCEEDED_ERROR;
        break;
      case 400:
        errorType = SeRankingErrorType.INVALID_REQUEST_ERROR;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = SeRankingErrorType.NETWORK_ERROR;
        retryable = true;
        break;
      default:
        errorType = SeRankingErrorType.UNKNOWN_ERROR;
        retryable = response.status >= 500;
    }

    const err = errorData as Record<string, unknown> | null;
    const message =
      (typeof err?.message === 'string' ? err.message : null) ||
      (typeof err?.error === 'string' ? err.error : null) ||
      `HTTP ${response.status}: ${response.statusText}`;

    return new SeRankingApiError(message, errorType, {
      statusCode: response.status,
      response: errorData,
      retryable,
    });
  }

  /**
   * Create generic error for non-HTTP errors
   */
  private createGenericError(error: unknown): SeRankingApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new SeRankingApiError('Request timeout', SeRankingErrorType.TIMEOUT_ERROR, {
          retryable: true,
        });
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new SeRankingApiError(
          'Network connection failed',
          SeRankingErrorType.NETWORK_ERROR,
          { retryable: true }
        );
      }

      return new SeRankingApiError(
        error.message || 'Unknown error occurred',
        SeRankingErrorType.UNKNOWN_ERROR,
        {
          retryable: false,
          response: error,
        }
      );
    }

    return new SeRankingApiError(
      String(error) || 'Unknown error occurred',
      SeRankingErrorType.UNKNOWN_ERROR,
      {
        retryable: false,
        response: error,
      }
    );
  }

  /**
   * Get actual SeRanking API key from database
   */
  private async getActualApiKey(): Promise<string | null> {
    try {
      if (
        this.integrationApiKey &&
        this.integrationApiKeyExpiry &&
        new Date() < this.integrationApiKeyExpiry
      ) {
        return this.integrationApiKey;
      }

      const data = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_seranking_api_key',
          reason: 'Retrieving API key configuration',
          source: 'SeRankingApiClient.getActualApiKey',
          metadata: { service_name: 'seranking_keyword_export' },
        },
        { table: 'indb_site_integration', operationType: 'select' },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_site_integration')
            .select('api_key, is_active')
            .eq('service_name', 'seranking_keyword_export')
            .eq('is_active', true)
            .single();

          if (error && error.code !== 'PGRST116') return null;
          return data;
        }
      );

      if (!data || !data.api_key) return null;

      this.integrationApiKey = data.api_key;
      this.integrationApiKeyExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      return this.integrationApiKey;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse Retry-After header from HTTP response
   */
  private parseRetryAfterHeader(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    if (!retryAfter) return 0;

    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return Math.max(0, Math.min(seconds, 300));

    try {
      const retryDate = new Date(retryAfter);
      const now = new Date();
      const diffMs = retryDate.getTime() - now.getTime();
      return Math.max(0, Math.min(Math.ceil(diffMs / 1000), 300));
    } catch {
      /* Invalid date in Retry-After header */
      return 0;
    }
  }

  private calculateExponentialBackoff(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }
}

export class SeRankingApiError extends Error implements ISeRankingError {
  public type: SeRankingErrorType;
  public statusCode?: number;
  public response?: unknown;
  public retryable: boolean;

  constructor(
    message: string,
    type: SeRankingErrorType,
    options: { statusCode?: number; response?: unknown; retryable: boolean }
  ) {
    super(message);
    this.name = 'SeRankingApiError';
    this.type = type;
    this.statusCode = options.statusCode;
    this.response = options.response;
    this.retryable = options.retryable;
  }
}
