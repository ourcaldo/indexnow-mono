/**
 * Error type definitions for IndexNow Studio
 */

import { type Json } from './Json';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SYSTEM = 'SYSTEM_ERROR',
  NETWORK = 'NETWORK_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
  ENCRYPTION = 'ENCRYPTION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ApiError {
  code: string;
  message: string;
  details?: Json;
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: Json;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}