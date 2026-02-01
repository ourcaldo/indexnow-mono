import { QueryClient } from '@tanstack/react-query'
import { 
  ErrorType, 
  ErrorSeverity, 
  supabaseBrowser as supabase 
} from '..'
import { type Json } from '../types/common/Json'

export class ApiError extends Error {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  timestamp: string
  statusCode: number

  constructor(errorResponse: Record<string, Json | undefined>) {
    super(typeof errorResponse.message === 'string' ? errorResponse.message : 'An unexpected error occurred')
    this.name = 'ApiError'
    this.id = typeof errorResponse.id === 'string' ? errorResponse.id : ''
    this.type = (errorResponse.type as ErrorType) || ErrorType.INTERNAL
    this.severity = (errorResponse.severity as ErrorSeverity) || ErrorSeverity.MEDIUM
    this.timestamp = typeof errorResponse.timestamp === 'string' ? errorResponse.timestamp : new Date().toISOString()
    this.statusCode = typeof errorResponse.statusCode === 'number' ? errorResponse.statusCode : 500
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, 
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const apiRequest = async <T = Json>(url: string, options?: RequestInit): Promise<T> => {
  const fullUrl = url.startsWith('http') || url.includes('/api/v1') ? url : 
    url.startsWith('/') ? url : `/${url}`
  
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  const response = await fetch(fullUrl, {
    headers,
    credentials: 'include',
    ...options,
  })

  const rawResponse = await response.json().catch(() => ({}))
  const jsonResponse: { success?: boolean; data?: T; error?: Record<string, Json | undefined> } = rawResponse
  const isStandardizedFormat = 'success' in jsonResponse

  if (!response.ok) {
    if (isStandardizedFormat && jsonResponse.success === false) {
      throw new ApiError(jsonResponse.error || { message: `HTTP Error: ${response.status}` })
    } else {
      const errorPayload = jsonResponse.error
      const errorMessage = typeof errorPayload === 'object' && errorPayload !== null && 'message' in errorPayload
        ? String(errorPayload.message)
        : `HTTP Error: ${response.status}`;
      throw new Error(errorMessage)
    }
  }

  if (isStandardizedFormat && jsonResponse.success === true) {
    if (jsonResponse.data === undefined) {
      throw new Error('API indicated success but returned no data')
    }
    return jsonResponse.data as T
  } else {
    return rawResponse as T
  }
}

export default queryClient
