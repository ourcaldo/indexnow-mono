/**
 * Error tracking and monitoring type definitions for IndexNow Studio
 */

import { type Json } from '../common/Json';
import { ErrorType, ErrorSeverity } from '../common/ErrorTypes';

export interface StructuredError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode: number;
  metadata?: Record<string, Json>;
  stack?: string;
  timestamp: Date;
}

export interface RankCheckError {
  keywordId: string;
  userId: string;
  errorType: 'quota_exceeded' | 'api_error' | 'parsing_error' | 'network_error' | 'authentication_error';
  errorMessage: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, Json>;
}

export interface ErrorStats {
  errorType: string;
  count: number;
  severity: string;
  lastOccurrence: Date;
  affectedUsers: number;
  affectedKeywords: number;
}

export interface SystemErrorStats {
  totalErrors: number;
  errorsByType: ErrorStats[];
  criticalErrors: number;
  affectedUsers: number;
  trends: Record<string, number>;
}
