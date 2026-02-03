/**
 * Centralized API Client for IndexNow Studio
 * Handles all HTTP requests with consistent error handling
 */

import { ApiEndpoints, type Json } from '@indexnow/shared';

export interface ExtendedApiResponse<T> {
  success: boolean;
  data: T;
  error?: any;
  requestId: string;
  timestamp: string;
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

  private async request<T = Json>(
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

      const data = (await response.json()) as ExtendedApiResponse<T>;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', undefined, 'HIGH', 408);
        }
        throw error;
      }
      
      throw new ApiError('An unexpected error occurred', undefined, 'HIGH', 500);
    }
  }

  async get<T = Json>(endpoint: string, headers?: Record<string, string>): Promise<ExtendedApiResponse<T | undefined>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T = Json>(
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

  async put<T = Json>(
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

  async delete<T = Json>(endpoint: string, headers?: Record<string, string>): Promise<ExtendedApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async patch<T = Json>(
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
export const apiRequest = async <T = Json>(endpoint: string, options?: RequestInit): Promise<T> => {
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

  const jsonResponse = await response.json().catch(() => ({ 
    success: false, 
    error: { message: 'Invalid JSON response' },
    requestId: 'unknown',
    timestamp: new Date().toISOString()
  })) as ExtendedApiResponse<T>;

  if (!response.ok || jsonResponse.success === false) {
    const errorData = jsonResponse.success === false ? jsonResponse.error : { message: `HTTP Error: ${response.status}` };
    const apiError = new ApiError(
      typeof errorData === 'string' ? errorData : (errorData.message || 'An unexpected error occurred'),
      jsonResponse.requestId || (jsonResponse.success === false ? jsonResponse.error?.id : undefined),
      jsonResponse.success === false ? jsonResponse.error?.severity : 'HIGH',
      response.status
    );
    throw apiError;
  }

  return jsonResponse.data;
};

