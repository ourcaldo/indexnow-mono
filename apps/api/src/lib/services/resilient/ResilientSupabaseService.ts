import { supabaseAdmin } from '@indexnow/database';
import { logger } from '@/lib/monitoring/error-handling';
import { type Json } from '@indexnow/shared';

/**
 * Service for performing database operations with automatic retries and resilience
 */
export class ResilientSupabaseService {
  /**
   * Execute a Supabase query with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: { code?: string; message: string } | null }>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T | null> {
    let lastError: { code?: string; message: string } | Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await operation();
        
        if (!error) {
          return data;
        }
        
        lastError = error;
        
        // Don't retry on certain errors (e.g., validation errors)
        if (error.code === '23505' || error.code === '42P01') {
          break;
        }
        
        logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.error(`Exception during database operation (attempt ${attempt}/${maxRetries}): ${lastError.message}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    
    throw lastError || new Error('Database operation failed after multiple attempts');
  }

  async executeSecureOperation<T>(
    operation: () => Promise<T>,
    context: Record<string, Json>
  ): Promise<T> {
    const contextId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Execute operation with retry logic
      return await this.executeWithRetry(async () => {
        return await operation();
      }, context);
    } catch (error: unknown) {
      // Log failure
      const duration = Date.now() - startTime;
      logger.error({
        contextId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        ...context
      }, 'Secure operation failed');
      
      throw error;
    }
  }
}
