/**
 * Unified ApiError class for the database package.
 *
 * Replaces two separate `ApiError` implementations that existed in
 * `ApiClient.ts` (positional args) and `queryClient.ts` (object args).
 * Supports both construction patterns for backward compatibility.
 */

import { ErrorType, ErrorSeverity, type Json } from '@indexnow/shared';

export class ApiError extends Error {
  public id: string;
  public type: ErrorType;
  public severity: ErrorSeverity;
  public timestamp: string;
  public statusCode: number;

  /**
   * Construct an ApiError.
   *
   * @overload Positional: `new ApiError("message", "id", "HIGH", 500)`
   * @overload Object:     `new ApiError({ message: "...", id: "...", statusCode: 500 })`
   */
  constructor(input: string | Record<string, Json | undefined>, id?: string, severity?: string, statusCode?: number) {
    if (typeof input === 'string') {
      // Positional-arg pattern (legacy ApiClient.ts callers)
      super(input);
      this.id = id ?? '';
      this.type = ErrorType.INTERNAL;
      this.severity = (severity as ErrorSeverity) ?? ErrorSeverity.MEDIUM;
      this.timestamp = new Date().toISOString();
      this.statusCode = statusCode ?? 500;
    } else {
      // Object pattern (legacy queryClient.ts callers)
      super(typeof input.message === 'string' ? input.message : 'An unexpected error occurred');
      this.id = typeof input.id === 'string' ? input.id : '';
      this.type = (input.type as ErrorType) || ErrorType.INTERNAL;
      this.severity = (input.severity as ErrorSeverity) || ErrorSeverity.MEDIUM;
      this.timestamp = typeof input.timestamp === 'string' ? input.timestamp : new Date().toISOString();
      this.statusCode = typeof input.statusCode === 'number' ? input.statusCode : 500;
    }
    this.name = 'ApiError';
  }
}
