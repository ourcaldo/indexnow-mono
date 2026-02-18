/**
 * Centralized API Client for IndexNow Studio
 * Handles all HTTP requests with consistent error handling
 */

import { ApiEndpoints, type Json } from '@indexnow/shared';
import { ApiError } from './api-error';

// Re-export for backward compatibility
export { ApiError } from './api-error';

export interface ApiErrorDetails {
  message: string;
  id?: string;
  severity?: string;
  code?: string;
  details?: unknown;
}

export interface ExtendedApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string | ApiErrorDetails;
  requestId: string;
  timestamp: string;
}

function isExtendedApiResponse<T>(data: unknown): data is ExtendedApiResponse<T> {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  
  return (
    typeof response.success === 'boolean' &&
    'data' in response &&
    typeof response.requestId === 'string' &&
    typeof response.timestamp === 'string'
  );
}

interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      // Default to V1 base but normalized
      baseUrl: config.baseUrl || ApiEndpoints.V1.replace('/v1', ''),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ExtendedApiResponse<T>> {
    // Ensure endpoint starts with / if not a full URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: unknown = await response.json();
      
      if (!isExtendedApiResponse<T>(data)) {
        throw new ApiError('Invalid API response format', undefined, 'HIGH', 500);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', undefined, 'HIGH', 408);
        }
        if (error instanceof ApiError) {
          throw error;
        }
        throw error;
      }
      
      throw new ApiError('An unexpected error occurred', undefined, 'HIGH', 500);
    }
  }

  async get<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<ExtendedApiResponse<T | undefined>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: Json,
    headers?: Record<string, string>
  ): Promise<ExtendedApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: Json,
    headers?: Record<string, string>
  ): Promise<ExtendedApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<ExtendedApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: Json,
    headers?: Record<string, string>
  ): Promise<ExtendedApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Default instance
export const apiClient = new ApiClient();

