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

class Logger {
  private isProductionEnv = isProduction();

  private formatMessage(level: LogLevel, context: LogContext, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  private log(level: LogLevel, context: LogContext | string, message?: string) {
    const ctx = typeof context === 'string' ? {} : context;
    const msg = typeof context === 'string' ? context : message || '';

    if (this.isProductionEnv) return;

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
    return new Error(config.message);
  }
};

export const logger = new Logger();
