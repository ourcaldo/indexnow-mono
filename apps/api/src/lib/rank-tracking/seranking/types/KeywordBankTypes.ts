/**
 * Keyword Bank Database Type Definitions
 * Types for keyword bank table and related database operations
 */

import { Database, Json } from '@indexnow/shared';

// Keyword Bank Database Entity
export interface KeywordBankEntity {
  id: string;
  keyword: string;
  country_id: string | null; // UUID FK to indb_keyword_countries
  language_code: string;
  is_data_found: boolean;
  volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  history_trend: Json | null;
  keyword_intent: string | null;
  data_updated_at: string | null; // Date -> string for API/DB compatibility
  created_at: string;
  updated_at: string;
}

// Insert/Update Types
export interface KeywordBankInsert {
  keyword: string;
  country_id: string;
  language_code?: string;
  is_data_found: boolean;
  volume?: number | null;
  cpc?: number | null;
  competition?: number | null;
  difficulty?: number | null;
  history_trend?: Json | null;
  keyword_intent?: string | null;
}

export interface KeywordBankUpdate {
  is_data_found?: boolean;
  volume?: number | null;
  cpc?: number | null;
  competition?: number | null;
  difficulty?: number | null;
  history_trend?: Json | null;
  keyword_intent?: string | null;
  data_updated_at?: string;
  updated_at?: string;
}

// Enhanced Keyword Entity (from indb_rank_keywords with intelligence)
export interface EnhancedKeywordEntity {
  id: string;
  user_id: string;
  domain_id: string;
  keyword: string;
  device_type: string;
  country_id: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_check_date: string | null;
  // Intelligence fields
  keyword_bank_id: string | null;
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  keyword_intent: string | null;
  history_trend: Json | null;
  intelligence_updated_at: string | null;
}

// Search and Query Types
export interface KeywordBankQuery {
  keyword?: string;
  country_id?: string;
  language_code?: string;
  is_data_found?: boolean;
  min_volume?: number;
  max_volume?: number;
  min_difficulty?: number;
  max_difficulty?: number;
  keyword_intent?: string;
  updated_since?: string;
  limit?: number;
  offset?: number;
  order_by?: 'keyword' | 'volume' | 'difficulty' | 'cpc' | 'competition' | 'data_updated_at';
  order_direction?: 'asc' | 'desc';
}

export interface KeywordBankQueryResult {
  data: KeywordBankEntity[];
  total: number;
  has_more: boolean;
  next_offset?: number;
}

// Database Operation Results
export interface KeywordBankOperationResult {
  success: boolean;
  data?: KeywordBankEntity;
  affected_rows?: number;
  keyword?: string;
  operation?: string;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface BulkKeywordBankOperationResult {
  success: boolean;
  data?: KeywordBankEntity[];
  total_processed: number;
  successful: number;
  failed: number;
  errors?: Array<{
    keyword: string;
    country_id: string;
    error: string;
  }>;
}

// Cache Management Types
export interface KeywordCacheEntry {
  keyword: string;
  country_id: string;
  data: KeywordBankEntity;
  cached_at: string;
  expires_at: string;
  access_count: number;
  last_accessed: string;
}

export interface CacheStats {
  total_entries: number;
  cache_hits: number;
  cache_misses: number;
  hit_ratio: number;
  average_age: number;
  expired_entries: number;
  memory_usage: number;
  // Additional fields for cache status
  total_keywords: number;
  keywords_with_data: number;
  keywords_without_data: number;
  fresh_data: number;
  stale_data: number;
  data_found_rate: number;
  fresh_data_rate: number;
  last_updated: string;
}

// Data Migration Types
export interface MigrationJob {
  id: string;
  type: 'keyword_enrichment' | 'cache_refresh' | 'data_cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    current_keyword?: string;
  };
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  configuration: {
    batch_size: number;
    delay_between_batches: number;
    retry_failed: boolean;
    filter_criteria?: KeywordBankQuery;
  };
}

// Analytics Types
export interface KeywordBankAnalytics {
  total_keywords: number;
  keywords_with_data: number;
  keywords_without_data: number;
  average_volume: number;
  average_difficulty: number;
  average_cpc: number;
  data_freshness: {
    fresh_data: number; // Last 30 days
    stale_data: number; // 30-90 days
    old_data: number; // 90+ days
  };
  top_volume_keywords: Array<{
    keyword: string;
    volume: number;
    country_id: string;
  }>;
  intent_distribution: Record<string, number>;
  country_distribution: Record<string, number>;
}

// Validation Types
export interface KeywordBankValidation {
  keyword: {
    min_length: number;
    max_length: number;
    allowed_chars: RegExp;
    blocked_keywords: string[];
  };
  volume: {
    min_value: number;
    max_value: number;
  };
  cpc: {
    min_value: number;
    max_value: number;
  };
  competition: {
    min_value: number;
    max_value: number;
  };
  difficulty: {
    min_value: number;
    max_value: number;
  };
}

// Sync Status Types
export interface KeywordSyncStatus {
  keyword_id: string;
  keyword: string;
  bank_data_available: boolean;
  intelligence_synced: boolean;
  last_sync_attempt: Date;
  last_successful_sync: Date | null;
  sync_errors: string[];
  retry_count: number;
  next_retry_at: Date | null;
}

// Missing types used in KeywordBankService
export interface KeywordLookupParams {
  keyword: string;
  countryCode: string;
  languageCode?: string;
}

export interface CacheStatus {
  total_keywords: number;
  cached_keywords: number;
  missing_keywords: number;
  fresh_cache: number;
  stale_cache: number;
  cache_hit_rate: number;
  needs_api_call: boolean;
  missing_keyword_list: string[];
  stale_keyword_list: string[];
  fresh_data: KeywordBankEntity[];
  stale_data: KeywordBankEntity[];
}

export interface KeywordBankBatchResult {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  success_rate: number;
  results: KeywordBankOperationResult[];
  errors: string[];
}

// Export composite types for easier imports
export type KeywordWithIntelligence = EnhancedKeywordEntity;
export type KeywordBankSearch = KeywordBankQuery;
export type KeywordBankResult = KeywordBankQueryResult;
