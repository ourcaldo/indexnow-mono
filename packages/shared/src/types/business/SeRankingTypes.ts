/**
 * SeRanking API Type Definitions
 * Type definitions for SeRanking keyword export API integration
 */

import { type Json } from '../common/Json';

// SeRanking API Request Types
export interface SeRankingKeywordExportRequest {
  keywords: string[];
  source: string; // Country code like 'us', 'uk', etc.
  sort?: 'cpc' | 'volume' | 'competition' | 'difficulty';
  sort_order?: 'asc' | 'desc';
  cols?: string; // Comma-separated: 'keyword,volume,cpc,competition,difficulty,history_trend'
}

// SeRanking API Response Types
export interface SeRankingKeywordData {
  is_data_found: boolean;
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  history_trend: Record<string, number> | null;
}

export type SeRankingApiResponse = SeRankingKeywordData[];

// API Client Configuration
export interface SeRankingClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// API Request Configuration
export interface ApiRequestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: FormData | URLSearchParams | string;
  timeout?: number;
}

// Rate Limiting Types
export interface SeRankingRateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface RateLimitState {
  minuteRequests: number[];
  hourRequests: number[];
  dailyRequests: number[];
  lastReset: {
    minute: Date;
    hour: Date;
    day: Date;
  };
}

// Error Types
export enum SeRankingErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  QUOTA_EXCEEDED_ERROR = 'QUOTA_EXCEEDED_ERROR',
  INVALID_REQUEST_ERROR = 'INVALID_REQUEST_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SeRankingError extends Error {
  type: SeRankingErrorType;
  statusCode?: number;
  response?: Json;
  retryable: boolean;
  context?: SeRankingErrorContext;
  timestamp?: Date;
  originalError?: Error;
  circuitBreakerState?: CircuitBreakerState;
}

// Quota Management Types
export interface QuotaStatus {
  current_usage: number;
  quota_limit: number;
  quota_remaining: number;
  usage_percentage: number;
  reset_date: Date;
  is_approaching_limit: boolean;
  is_quota_exceeded: boolean;
}

export interface QuotaAlert {
  threshold: number;
  enabled: boolean;
  last_triggered?: Date;
}

// Metrics and Monitoring Types
export interface ApiMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  cache_hits: number;
  cache_misses: number;
  last_request_time?: Date;
}

export interface SeRankingHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  response_time?: number;
  last_check: Date;
  error_message?: string;
  error?: string;
  warning?: string;
  timestamp?: Date;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: SeRankingErrorType;
    message: string;
    details?: Json;
  };
  metadata?: {
    source: 'cache' | 'api';
    timestamp: Date;
    quota_remaining?: number;
    response_time?: number;
  };
}

// Bulk Processing Types
export interface BulkKeywordRequest {
  keyword: string;
  country_code: string;
  language_code?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface BulkProcessingJob {
  id: string;
  keywords: BulkKeywordRequest[];
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  error_message?: string;
  estimated_completion?: Date;
}

// Validation Types
export interface KeywordValidationResult {
  isValid: boolean;
  keyword: string;
  country_code: string;
  errors: string[];
  warnings: string[];
}

export interface ApiResponseValidationResult {
  isValid: boolean;
  data?: SeRankingKeywordData[];
  errors: string[];
  warnings: string[];
  fixed_data?: SeRankingKeywordData[];
}

// Integration Settings Types
export interface IntegrationSettings {
  service_name: string;
  api_key: string;
  api_url: string;
  api_quota_limit: number;
  api_quota_used: number;
  quota_reset_date: Date;
  is_active: boolean;
  rate_limits: SeRankingRateLimitConfig;
  alert_settings: {
    quota_alerts: QuotaAlert[];
    error_notifications: boolean;
    performance_alerts: boolean;
  };
}

// Export utility type for better developer experience
export type SeRankingServiceConfig = {
  client: SeRankingClientConfig;
  rateLimit: SeRankingRateLimitConfig;
  quotaAlerts: QuotaAlert[];
  enableMetrics: boolean;
  enableHealthChecks: boolean;
};

// Usage tracking data structure
export interface QuotaUsageEntry {
  id?: string;
  timestamp: Date;
  user_id?: string;
  operation_type: string;
  quota_consumed: number;
  quota_remaining: number;
  quota_limit: number;
  usage_percentage: number;
  session_id?: string;
  endpoint?: string;
  country_code?: string;
  keywords_count?: number;
  cost_per_request?: number;
  metadata?: Record<string, Json>;
}

// Usage pattern analysis results
export interface UsagePattern {
  pattern_id: string;
  pattern_type: 'hourly' | 'daily' | 'weekly' | 'seasonal' | 'burst';
  confidence: number; // 0-1
  description: string;
  detected_at: Date;
  pattern_data: {
    peak_hours?: number[];
    peak_days?: string[];
    average_usage_rate: number;
    peak_usage_rate: number;
    variance: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  predictions: {
    next_peak_time?: Date;
    expected_usage_rate: number;
    confidence_interval: [number, number];
  };
  recommendations: Array<{
    type: 'quota_increase' | 'usage_optimization' | 'rate_limiting' | 'scheduling';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimated_impact: string;
  }>;
}

// Quota prediction results
export interface QuotaPrediction {
  prediction_id: string;
  generated_at: Date;
  prediction_horizon_hours: number;
  current_usage: number;
  current_limit: number;
  predicted_usage: number;
  exhaustion_eta?: Date;
  confidence: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: string[];
  recommended_actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimated_impact: string;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
}

// Advanced quota status with analytics
export interface EnhancedQuotaStatus extends QuotaStatus {
  velocity: {
    requests_per_minute: number;
    requests_per_hour: number;
    trend_direction: 'up' | 'stable' | 'down';
    acceleration: number;
  };
  efficiency_metrics: {
    cost_per_successful_request: number;
    cache_hit_rate: number;
    error_rate: number;
    optimization_score: number;
  };
  historical_comparison: {
    same_time_yesterday: number;
    same_time_last_week: number;
    average_this_period: number;
    peak_this_period: number;
  };
  active_patterns: UsagePattern[];
  current_prediction: QuotaPrediction;
}

// Individual health check result with detailed metrics
export interface DetailedHealthCheck extends SeRankingHealthCheckResult {
  service_name: string;
  check_type: 'api' | 'database' | 'cache' | 'queue' | 'dependency' | 'custom';
  dependency_level: 'critical' | 'important' | 'optional';
  metrics: {
    response_time: number;
    availability_percent: number;
    error_rate_percent: number;
    throughput: number;
    resource_utilization?: {
      cpu?: number;
      memory?: number;
      disk?: number;
    };
  };
  diagnostics: {
    checks_performed: string[];
    anomalies_detected: string[];
    performance_issues: string[];
    recovery_attempts: number;
  };
  historical_comparison: {
    compared_to_yesterday: 'better' | 'same' | 'worse';
    compared_to_last_week: 'better' | 'same' | 'worse';
    trend_direction: 'improving' | 'stable' | 'degrading';
  };
  recommendations: Array<{
    type: 'immediate' | 'short_term' | 'long_term';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    implementation_effort: 'low' | 'medium' | 'high';
    estimated_impact: string;
  }>;
}

// System-wide health summary
export interface SystemHealthSummary {
  overall_status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  overall_score: number; // 0-100
  component_health: {
    api_gateway: DetailedHealthCheck;
    database: DetailedHealthCheck;
    cache_layer: DetailedHealthCheck;
    keyword_bank: DetailedHealthCheck;
    integration_service: DetailedHealthCheck;
    quota_monitor: DetailedHealthCheck;
    metrics_collector: DetailedHealthCheck;
  };
  system_metrics: {
    total_dependencies: number;
    healthy_dependencies: number;
    degraded_dependencies: number;
    unhealthy_dependencies: number;
    average_response_time: number;
    system_uptime_hours: number;
    last_incident_hours_ago?: number;
  };
  active_incidents: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    description: string;
    started_at: Date;
    estimated_resolution?: Date;
    recovery_actions: string[];
  }>;
  predictive_alerts: Array<{
    component: string;
    predicted_issue: string;
    probability: number;
    estimated_occurrence: Date;
    preventive_actions: string[];
  }>;
  performance_bottlenecks: Array<{
    component: string;
    bottleneck_type: 'cpu' | 'memory' | 'network' | 'database' | 'api_limit';
    severity_score: number;
    impact_description: string;
    optimization_suggestions: string[];
  }>;
}

// Recovery action result
export interface RecoveryActionResult {
  action_id: string;
  component: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  started_at: Date;
  completed_at?: Date;
  outcome_description: string;
  side_effects: string[];
  next_steps: string[];
}

import { ErrorContext } from '../global/Application';

// Error context for handling and logging
export interface SeRankingErrorContext extends ErrorContext {
  operation: string;
  userId?: string;
  keywords?: string[];
  countryCode?: string;
  batchSize?: number;
  apiEndpoint?: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: Json | undefined;
}

// Recovery result from error handling
export interface RecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: SeRankingError;
  strategy?: string;
  attempts?: number;
  totalTime?: number;
  fallbackUsed?: boolean;
}

// Performance analysis results
export interface PerformanceAnalysis {
  overall_health_score: number; // 0-100
  performance_trends: {
    response_time: 'improving' | 'stable' | 'degrading';
    error_rate: 'improving' | 'stable' | 'degrading';
    cache_performance: 'improving' | 'stable' | 'degrading';
  };
  bottlenecks: Array<{
    type: 'high_error_rate' | 'slow_response' | 'poor_cache_hit' | 'quota_pressure';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendations: string[];
  }>;
  predictions: {
    quota_exhaustion_eta?: Date;
    expected_error_increase?: number;
    cache_efficiency_trend: number;
  };
}

// Alert configuration
export interface MetricsAlert {
  id: string;
  type: 'error_rate' | 'response_time' | 'cache_miss_rate' | 'quota_threshold';
  threshold: number;
  period_minutes: number;
  is_active: boolean;
  last_triggered?: Date;
  escalation_count: number;
}

// Aggregated metrics for time periods
export interface AggregatedMetrics {
  period: string; // ISO date string
  period_type: 'hour' | 'day' | 'week' | 'month';
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  timeout_requests: number;
  rate_limited_requests: number;
  average_response_time: number;
  median_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  error_breakdown: Record<SeRankingErrorType, number>;
  quota_utilization_avg: number;
  total_keywords_processed: number;
  unique_users: number;
  peak_rps: number; // requests per second
  created_at: Date;
}
