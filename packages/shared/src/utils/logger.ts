/**
 * Simple universal logger for IndexNow Studio
 * Works in both browser and server environments
 */

import { type Json } from '../types/common/Json';
import { isProduction } from '../core/config/AppConfig';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext extends Record<string, Json | Error | object | undefined> {
  error?: Error | string | object;
  userId?: string;
  eventType?: string;
  activityId?: string;
}

// Logger transport interface — allows pino or other structured loggers to receive shared package logs
export interface LoggerTransport {
  debug(obj: object, msg: string): void
  info(obj: object, msg: string): void
  warn(obj: object, msg: string): void
  error(obj: object, msg: string): void
}

let _transport: LoggerTransport | null = null

/**
 * Set an external logger transport (e.g., pino) to receive all shared package log calls.
 * Call this once at app startup. When set, all logger.info/warn/error/debug calls
 * from @indexnow/shared packages will route through the transport instead of console.
 */
export function setLoggerTransport(transport: LoggerTransport): void {
  _transport = transport
}

class Logger {
  private isProductionEnv = isProduction();

  private formatMessage(level: LogLevel, _context: LogContext, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  private log(level: LogLevel, context: LogContext | string, message?: string) {
    const ctx = typeof context === 'string' ? {} : context;
    const msg = typeof context === 'string' ? context : message || '';

    // Delegate to external transport if configured (e.g., pino)
    if (_transport) {
      const transportLevel = level === 'fatal' ? 'error' : level;
      _transport[transportLevel](ctx, msg);
      return;
    }

    // In production, only allow warn/error/fatal through (suppress debug/info noise)
    if (this.isProductionEnv && (level === 'debug' || level === 'info')) return;

    const formattedMsg = this.formatMessage(level, ctx, msg);

    switch (level) {
      case 'debug':
        console.debug(formattedMsg, ctx);
        break;
      case 'info':
        console.info(formattedMsg, ctx);
        break;
      case 'warn':
        console.warn(formattedMsg, ctx);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMsg, ctx);
        break;
    }
  }

  debug(context: LogContext | string, message?: string) {
    this.log('debug', context, message);
  }

  info(context: LogContext | string, message?: string) {
    this.log('info', context, message);
  }

  warn(context: LogContext | string, message?: string) {
    this.log('warn', context, message);
  }

  error(context: LogContext | string, message?: string) {
    this.log('error', context, message);
  }

  fatal(context: LogContext | string, message?: string) {
    this.log('fatal', context, message);
  }
}

import { ErrorSeverity, ErrorType } from '../types/common/ErrorTypes';

export const ErrorHandlingService = {
  handle: (error: Error | string | object | null | undefined, context?: LogContext) => {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unexpected error occurred';

    // Safely convert non-Error objects to Json for logging
    const safeErrorMetadata = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : typeof error === 'object' && error !== null
        ? JSON.parse(JSON.stringify(error)) // Deep copy to ensure serializability
        : { rawError: String(error) };

    const logContext: LogContext = {
      ...(context || {}),
      error: safeErrorMetadata
    };

    logger.error(logContext, message);
  },
  createError: (config: {
    message: string;
    type?: ErrorType;
    severity?: ErrorSeverity;
    [key: string]: Json | ErrorType | ErrorSeverity | undefined;
  }) => {
    const logContext: LogContext = {
      errorType: config.type,
      severity: config.severity,
      ...config,
    };
    logger.error(logContext, config.message || 'Created error');
    // Return a structured error that preserves type/severity metadata (#13)
    const error = new Error(config.message);
    (error as Error & { type?: ErrorType; severity?: ErrorSeverity }).type = config.type;
    (error as Error & { type?: ErrorType; severity?: ErrorSeverity }).severity = config.severity;
    return error;
  }
};

export const logger = new Logger();
