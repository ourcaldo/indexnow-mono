/**
 * API Metrics Collector Service
 * API performance monitoring, metrics collection, and analysis
 */

import {
  ApiMetrics,
  SeRankingErrorType,
} from '../types/SeRankingTypes';
import { IApiMetricsCollector } from '../types/ServiceTypes';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';

// Extended metrics configuration
export interface ApiMetricsConfig {
  retentionDays: number;
  aggregationIntervals?: {
    realtime: number;
    hourly: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  alertingThresholds?: {
    errorRatePercent: number;
    responseTimeMs: number;
    cacheMissRatePercent: number;
  };
  enableDetailedLogging: boolean;
  enablePredictiveAnalysis?: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Detailed API call metadata
export interface ApiCallMetric {
  id?: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'timeout' | 'rate_limited';
  duration_ms: number;
  cache_hit: boolean;
  error_type?: SeRankingErrorType;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export class ApiMetricsCollector implements IApiMetricsCollector {
  private config: ApiMetricsConfig;
  private realtimeMetrics: ApiCallMetric[] = [];

  constructor(config: Partial<ApiMetricsConfig> = {}) {
    this.config = {
      retentionDays: 90,
      enableDetailedLogging: true,
      logLevel: 'info',
      ...config,
    };
  }

  async recordApiCall(duration: number, status: 'success' | 'error'): Promise<void> {
    const metric: ApiCallMetric = {
      timestamp: new Date(),
      endpoint: '/api/seranking',
      method: 'POST',
      status,
      duration_ms: duration,
      cache_hit: false,
    };
    this.realtimeMetrics.push(metric);

    if (this.config.enableDetailedLogging) {
      this.log('debug', `API call recorded: ${status} in ${duration}ms`);
    }
  }

  async recordCacheHit(duration: number): Promise<void> {
    const metric: ApiCallMetric = {
      timestamp: new Date(),
      endpoint: '/api/seranking/cache',
      method: 'GET',
      status: 'success',
      duration_ms: duration,
      cache_hit: true,
    };
    this.realtimeMetrics.push(metric);
  }

  async recordCacheMiss(): Promise<void> {
    this.log('debug', 'Cache miss recorded');
  }

  async getMetrics(timeRange?: 'hour' | 'day' | 'week' | 'month'): Promise<ApiMetrics> {
    const now = Date.now();
    const rangeMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    };
    const cutoff = timeRange ? now - rangeMs[timeRange] : 0;
    const filtered = this.realtimeMetrics.filter(
      (m) => m.timestamp.getTime() >= cutoff
    );

    const successful = filtered.filter((m) => m.status === 'success').length;
    const failed = filtered.filter((m) => m.status === 'error').length;
    const avgResponseTime =
      filtered.length > 0
        ? filtered.reduce((sum, m) => sum + m.duration_ms, 0) / filtered.length
        : 0;
    const cacheHits = filtered.filter((m) => m.cache_hit).length;
    const cacheMisses = filtered.filter((m) => !m.cache_hit).length;

    return {
      total_requests: filtered.length,
      successful_requests: successful,
      failed_requests: failed,
      average_response_time: Math.round(avgResponseTime),
      cache_hits: cacheHits,
      cache_misses: cacheMisses,
    };
  }

  async resetMetrics(): Promise<void> {
    this.realtimeMetrics = [];
    this.log('info', 'Metrics reset');
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string
  ): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.config.logLevel]) {
      logger[level]({}, `[ApiMetricsCollector] ${message}`);
    }
  }
}
