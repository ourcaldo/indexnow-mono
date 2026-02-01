/**
 * Response type definitions for IndexNow Studio
 */

import { type Json } from './Json';

export type ApiStatus = 'success' | 'error' | 'loading' | 'idle';

export interface ApiMetadata {
  timestamp: string;
  requestId?: string;
  duration?: number;
}

export interface BaseResponse {
  success: boolean;
  metadata?: ApiMetadata;
}

export interface SuccessResponse<T> extends BaseResponse {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Json;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}