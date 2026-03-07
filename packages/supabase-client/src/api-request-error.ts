/**
 * API Error class for client-side API request error handling.
 *
 * Supports both construction patterns:
 * - Positional: new ApiRequestError("message", 500)
 * - Object: new ApiRequestError({ message: "...", statusCode: 500 })
 */

import { ErrorType, ErrorSeverity, type Json } from '@indexnow/shared';

export class ApiRequestError extends Error {
  public id: string;
  public type: ErrorType;
  public severity: ErrorSeverity;
  public timestamp: string;
  public statusCode: number;

  constructor(
    input: string | Record<string, Json | undefined>,
    statusCode?: number
  ) {
    if (typeof input === 'string') {
      super(input);
      this.id = '';
      this.type = ErrorType.INTERNAL;
      this.severity = ErrorSeverity.MEDIUM;
      this.timestamp = new Date().toISOString();
      this.statusCode = statusCode ?? 500;
    } else {
      super(
        typeof input.message === 'string'
          ? input.message
          : 'An unexpected error occurred'
      );
      this.id = typeof input.id === 'string' ? input.id : '';
      this.type = (input.type as ErrorType) || ErrorType.INTERNAL;
      this.severity =
        (input.severity as ErrorSeverity) || ErrorSeverity.MEDIUM;
      this.timestamp =
        typeof input.timestamp === 'string'
          ? input.timestamp
          : new Date().toISOString();
      this.statusCode =
        typeof input.statusCode === 'number' ? input.statusCode : 500;
    }
    this.name = 'ApiRequestError';
  }
}
