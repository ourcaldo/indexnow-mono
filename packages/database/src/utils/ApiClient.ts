/**
 * Centralized API Client for IndexNow Studio
 * Handles all HTTP requests with consistent error handling
 */

import { ApiEndpoints, type Json } from '@indexnow/shared';

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

export class ApiError extends Error {
  public id?: string;
  public severity?: string;
  public statusCode?: number;

  constructor(message: string, id?: string, severity?: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.id = id;
    this.severity = severity;
    this.statusCode = statusCode;
  }
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

/**
 * Simplified API request helper that handles session tokens automatically
 */
export const apiRequest = async <T = unknown>(endpoint: string, options?: RequestInit): Promise<T> => {
  const { supabaseBrowser: supabase } = await import('../client');
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  let jsonResponse: unknown;
  try {
    jsonResponse = await response.json();
  } catch {
    // Construct a synthetic error response if JSON parsing fails
    const errorResponse: ExtendedApiResponse<T> = { 
      success: false, 
      data: {} as T, 
      error: { message: 'Invalid JSON response' },
      requestId: 'unknown',
      timestamp: new Date().toISOString()
    };
    jsonResponse = errorResponse;
  }

  if (!isExtendedApiResponse<T>(jsonResponse)) {
    // If response is not in expected format but is an error
    if (!response.ok) {
       const apiError = new ApiError(
          `HTTP Error: ${response.status}`,
          undefined,
          'HIGH',
          response.status
       );
       throw apiError;
    }
    
    throw new ApiError('Invalid API response format', undefined, 'HIGH', 500);
  }

  const extendedResponse = jsonResponse;

  if (!response.ok || extendedResponse.success === false) {
    const errorData = extendedResponse.success === false ? extendedResponse.error : { message: `HTTP Error: ${response.status}` };
    
    let message = 'An unexpected error occurred';
    let id: string | undefined;
    let severity: string | undefined = 'HIGH';
    
    if (typeof errorData === 'string') {
        message = errorData;
    } else if (errorData && typeof errorData === 'object') {
        const err = errorData as ApiErrorDetails;
        message = err.message || message;
        id = err.id;
        severity = err.severity;
    }

    const apiError = new ApiError(
      message,
      extendedResponse.requestId || id,
      severity,
      response.status
    );
    throw apiError;
  }

  return extendedResponse.data;
};

