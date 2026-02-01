import { logger } from '@/lib/monitoring/error-handling';

export interface JobErrorContext {
  jobId: string;
  jobType: string;
  jobName: string;
  metadata?: Record<string, any>;
}

export class JobErrorHandler {
  /**
   * Wrapper for job execution with error handling and logging
   */
  static async withJobErrorHandling<T>(
    operation: () => Promise<T>,
    context: JobErrorContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.info({ 
        jobId: context.jobId, 
        jobType: context.jobType,
        jobName: context.jobName,
        ...context.metadata 
      }, `Starting job: ${context.jobName}`);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      logger.info({ 
        jobId: context.jobId, 
        duration,
        ...context.metadata 
      }, `Job completed successfully: ${context.jobName}`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error({ 
        jobId: context.jobId, 
        error: errorMessage,
        duration,
        ...context.metadata 
      }, `Job failed: ${context.jobName} - ${errorMessage}`);
      
      throw error;
    }
  }
}
