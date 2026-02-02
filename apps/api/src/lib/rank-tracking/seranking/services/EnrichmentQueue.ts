import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
/**
 * Enrichment Queue Service
 * Manages job queue operations for keyword enrichment processing
 * Handles job prioritization, scheduling, and persistence
 */

import {
  EnrichmentJob,
  EnrichmentJobType,
  EnrichmentJobStatus,
  JobPriority,
  EnrichmentJobConfig,
  EnrichmentJobData,
  JobProgress,
  QueueStats,
  CreateJobResponse,
  JobStatusResponse,
  QueueOperationResponse,
  EnqueueJobRequest,
  BatchEnqueueRequest,
  JobEvent,
  JobEventType,
  JobError,
  JobErrorType,
  EnrichmentJobRecord,
  EnrichmentJobInsert,
  EnrichmentJobUpdate,
  IEnrichmentQueue,
  Json,
  SingleKeywordJobData,
  BulkEnrichmentJobData,
  CacheRefreshJobData
} from '@indexnow/shared';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/monitoring/error-handling';

// Queue configuration
export interface QueueConfig {
  maxQueueSize: number;
  defaultBatchSize: number;
  jobTimeout: number;
  retryDelayMultiplier: number;
  maxRetries: number;
  cleanupInterval: number;
  heartbeatInterval: number;
  enableMetrics: boolean;
  enableEvents: boolean;
  deadLetterThreshold: number;
}

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxQueueSize: 10000,
  defaultBatchSize: 25,
  jobTimeout: 300000, // 5 minutes
  retryDelayMultiplier: 2,
  maxRetries: 3,
  cleanupInterval: 3600000, // 1 hour
  heartbeatInterval: 30000, // 30 seconds
  enableMetrics: true,
  enableEvents: true,
  deadLetterThreshold: 5
};

const DEFAULT_JOB_CONFIG: EnrichmentJobConfig = {
  batchSize: 25,
  maxRetries: 3,
  retryDelayMs: 60000, // 1 minute
  timeoutMs: 300000, // 5 minutes
  priority: JobPriority.NORMAL,
  preserveOrder: false,
  enableRateLimiting: true,
  quotaThreshold: 0.8,
  notifyOnCompletion: false
};

export class EnrichmentQueue extends EventEmitter implements IEnrichmentQueue {
  private config: QueueConfig;
  private isRunning: boolean = false;
  private cleanupTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private metrics: {
    jobsEnqueued: number;
    jobsProcessed: number;
    jobsFailed: number;
    totalProcessingTime: number;
    lastProcessedAt?: Date;
  };

  constructor(config: Partial<QueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.metrics = {
      jobsEnqueued: 0,
      jobsProcessed: 0,
      jobsFailed: 0,
      totalProcessingTime: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize the queue system
   */
  private async initialize(): Promise<void> {
    try {
      await this.createJobTable();
      this.startCleanupTimer();
      this.startHeartbeatTimer();
      this.isRunning = true;
      
      if (this.config.enableEvents) {
        this.emit('queue:initialized');
      }
      
      logger.info({}, 'EnrichmentQueue initialized successfully');
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to initialize EnrichmentQueue');
      throw error;
    }
  }

  /**
   * Enqueue a single enrichment job
   */
  async enqueueJob(
    userId: string,
    jobRequest: EnqueueJobRequest,
    scheduledFor?: Date
  ): Promise<CreateJobResponse> {
    try {
      // Validate queue capacity
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.config.maxQueueSize) {
        return {
          success: false,
          error: 'Queue is at maximum capacity'
        };
      }

      // Validate job data
      const validation = this.validateJobData(jobRequest);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid job data: ${validation.errors.join(', ')}`
        };
      }

      // Create job configuration
      const jobConfig: EnrichmentJobConfig = {
        ...DEFAULT_JOB_CONFIG,
        ...jobRequest.config
      };

      // Create initial progress
      const totalKeywords = this.calculateTotalKeywords(jobRequest.data);
      const progress: JobProgress = {
        total: totalKeywords,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        startedAt: new Date()
      };

      // Create job record
      const jobId = uuidv4();
      const job: EnrichmentJobInsert = {
        id: jobId,
        user_id: userId,
        name: this.generateJobName(jobRequest.type, jobRequest.data),
        type: 'keyword_enrichment',
        job_type: jobRequest.type,
        status: scheduledFor ? EnrichmentJobStatus.QUEUED : EnrichmentJobStatus.QUEUED,
        priority: jobRequest.priority || JobPriority.NORMAL,
        config: jobConfig,
        source_data: jobRequest.data,
        progress_data: progress,
        retry_count: 0,
        metadata: jobRequest.metadata,
        next_retry_at: scheduledFor?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert job into database
      const data = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'enqueue_enrichment_job',
          reason: 'Enqueueing new enrichment job for keyword processing queue management',
          source: 'rank-tracking/seranking/services/EnrichmentQueue',
          metadata: {
            job_id: jobId,
            job_type: jobRequest.type,
            user_id: userId,
            total_keywords: totalKeywords,
            priority: jobRequest.priority || JobPriority.NORMAL,
            operation_type: 'job_enqueue'
          }
        },
        {
          table: 'indb_enrichment_jobs',
          operationType: 'insert',
          data: job
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_enrichment_jobs')
            .insert([job])
            .select()
            .single()

          if (error) {
            throw new Error(`Failed to insert job: ${error.message}`)
          }

          return data
        }
      )

      if (!data) {
        logger.error({}, 'Failed to insert job: No data returned')
        return {
          success: false,
          error: 'Failed to create job'
        }
      }

      this.metrics.jobsEnqueued++;
      
      // Emit event
      if (this.config.enableEvents) {
        this.emitJobEvent(JobEventType.JOB_CREATED, jobId, userId);
      }

      // Calculate queue position and estimated completion
      const queuePosition = await this.getJobQueuePosition(jobId);
      const estimatedCompletion = this.calculateEstimatedCompletion(totalKeywords, queuePosition);

      return {
        success: true,
        jobId,
        queuePosition,
        estimatedCompletion
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error enqueuing job');
      return {
        success: false,
        error: 'Internal error occurred'
      };
    }
  }

  /**
   * Enqueue multiple jobs in batch using a single database operation
   */
  async enqueueBatch(
    userId: string,
    batchRequest: BatchEnqueueRequest
  ): Promise<CreateJobResponse[]> {
    try {
      // Validate queue capacity for the entire batch
      const queueSize = await this.getQueueSize();
      if (queueSize + batchRequest.jobs.length > this.config.maxQueueSize) {
        return batchRequest.jobs.map(() => ({
          success: false,
          error: 'Queue would exceed maximum capacity'
        }));
      }

      const jobsToInsert: EnrichmentJobInsert[] = [];
      const validationResults: CreateJobResponse[] = [];

      // Prepare all job records and validate
      for (const jobRequest of batchRequest.jobs) {
        const validation = this.validateJobData(jobRequest);
        if (!validation.isValid) {
          validationResults.push({
            success: false,
            error: `Invalid job data: ${validation.errors.join(', ')}`
          });
          continue;
        }

        const mergedConfig: EnrichmentJobConfig = {
          ...DEFAULT_JOB_CONFIG,
          ...batchRequest.globalConfig,
          ...jobRequest.config
        };

        const totalKeywords = this.calculateTotalKeywords(jobRequest.data);
        const jobId = uuidv4();
        
        const job: EnrichmentJobInsert = {
          id: jobId,
          user_id: userId,
          name: this.generateJobName(jobRequest.type, jobRequest.data),
          type: 'keyword_enrichment',
          job_type: jobRequest.type,
          status: EnrichmentJobStatus.QUEUED,
          priority: jobRequest.priority || JobPriority.NORMAL,
          config: mergedConfig,
          source_data: jobRequest.data,
          progress_data: {
            total: totalKeywords,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            startedAt: new Date()
          },
          retry_count: 0,
          metadata: jobRequest.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        jobsToInsert.push(job);
        // Placeholder for successful results - will update with queue position later
        validationResults.push({ success: true, jobId });
      }

      if (jobsToInsert.length === 0) {
        return validationResults;
      }

      // Perform bulk insert
      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'enqueue_batch_enrichment_jobs',
          reason: 'Bulk enqueueing enrichment jobs for keyword processing',
          source: 'rank-tracking/seranking/services/EnrichmentQueue',
          metadata: {
            batch_size: jobsToInsert.length,
            user_id: userId,
            operation_type: 'job_batch_enqueue'
          }
        },
        {
          table: 'indb_enrichment_jobs',
          operationType: 'insert',
          data: jobsToInsert
        },
        async () => {
          const { error } = await supabaseAdmin
            .from('indb_enrichment_jobs')
            .insert(jobsToInsert);

          if (error) {
            throw new Error(`Failed to insert batch jobs: ${error.message}`);
          }

          return { success: true };
        }
      );

      this.metrics.jobsEnqueued += jobsToInsert.length;
      
      // Update results with queue positions and emit events
      const finalResults: CreateJobResponse[] = [];
      let insertIdx = 0;

      for (let i = 0; i < validationResults.length; i++) {
        if (!validationResults[i].success) {
          finalResults.push(validationResults[i]);
          continue;
        }

        const jobId = validationResults[i].jobId!;
        
        if (this.config.enableEvents) {
          this.emitJobEvent(JobEventType.JOB_CREATED, jobId, userId);
        }

        // We could optimize this to not call getJobQueuePosition for every job in batch,
        // but since we just inserted them, it's safer to get current positions.
        const queuePosition = await this.getJobQueuePosition(jobId);
        
        finalResults.push({
          ...validationResults[i],
          queuePosition,
          estimatedCompletion: this.calculateEstimatedCompletion(
            this.calculateTotalKeywords(jobsToInsert[insertIdx].source_data as EnrichmentJobData),
            queuePosition
          )
        });
        
        insertIdx++;
      }

      return finalResults;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in batch enqueue');
      return batchRequest.jobs.map(() => ({
        success: false,
        error: 'Internal error occurred during batch processing'
      }));
    }
  }

  /**
   * Get next job from queue for processing
   */
  async dequeueJob(workerId: string): Promise<EnrichmentJob | null> {
    try {
      // Get highest priority job that's ready to process
      const jobs = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'dequeue_next_job',
          reason: 'Dequeuing next available job from enrichment queue for worker processing',
          source: 'rank-tracking/seranking/services/EnrichmentQueue',
          metadata: {
            worker_id: workerId,
            operation_type: 'job_dequeue'
          }
        },
        {
          table: 'indb_enrichment_jobs',
          operationType: 'select',
          columns: ['*'],
          whereConditions: {
            status: EnrichmentJobStatus.QUEUED,
            locked_at: null
          }
        },
        async () => {
          const { data: jobs, error } = await supabaseAdmin
            .from('indb_enrichment_jobs')
            .select('*')
            .eq('status', EnrichmentJobStatus.QUEUED)
            .is('locked_at', null)
            .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)

          if (error) {
            throw new Error(`Failed to get next job: ${error.message}`)
          }

          return jobs || []
        }
      )

      if (!jobs || jobs.length === 0) {
        return null
      }

      const jobRecord = jobs[0];
      
      // Lock the job
      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'lock_job_for_processing',
          reason: 'Locking enrichment job for exclusive worker processing to prevent race conditions',
          source: 'rank-tracking/seranking/services/EnrichmentQueue',
          metadata: {
            job_id: jobRecord.id,
            worker_id: workerId,
            operation_type: 'job_lock'
          }
        },
        {
          table: 'indb_enrichment_jobs',
          operationType: 'update',
          data: {
            status: EnrichmentJobStatus.PROCESSING,
            worker_id: workerId,
            locked_at: new Date().toISOString(),
            started_at: jobRecord.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          whereConditions: { 
            id: jobRecord.id,
            locked_at: null
          }
        },
        async () => {
          const { error: lockError } = await supabaseAdmin
            .from('indb_enrichment_jobs')
            .update({
              status: EnrichmentJobStatus.PROCESSING,
              worker_id: workerId,
              locked_at: new Date().toISOString(),
              started_at: jobRecord.started_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobRecord.id)
            .is('locked_at', null) // Ensure no race condition

          if (lockError) {
            throw new Error(`Failed to lock job: ${lockError.message}`)
          }

          return { success: true }
        }
      )

      // Convert to EnrichmentJob type
      const job = this.recordToJob(jobRecord);
      
      // Emit event
      if (this.config.enableEvents) {
        this.emitJobEvent(JobEventType.JOB_STARTED, job.id, job.userId, { workerId });
      }

      return job;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error dequeuing job');
      return null;
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    progress: Partial<JobProgress>
  ): Promise<boolean> {
    try {
      // Get current job
      const { data: job, error: fetchError } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .select('progress_data')
        .eq('id', jobId)
        .single();

      if (fetchError || !job) {
        logger.error({ jobId }, 'Job not found for progress update');
        return false;
      }

      // Merge progress data
      const updatedProgress = {
        ...job.progress_data,
        ...progress
      };

      // Calculate estimated completion
      if (updatedProgress.processed > 0 && updatedProgress.total > 0) {
        const averageTime = (Date.now() - new Date(updatedProgress.startedAt).getTime()) / updatedProgress.processed;
        const remainingItems = updatedProgress.total - updatedProgress.processed;
        updatedProgress.remainingTime = remainingItems * averageTime;
        updatedProgress.estimatedCompletionAt = new Date(Date.now() + updatedProgress.remainingTime);
        updatedProgress.averageProcessingTime = averageTime;
      }

      // Update database
      const { error: updateError } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .update({
          progress_data: updatedProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        logger.error({ error: updateError.message || String(updateError) }, 'Failed to update job progress');
        return false;
      }

      // Emit progress event
      if (this.config.enableEvents) {
        this.emitJobEvent(JobEventType.JOB_PROGRESS, jobId, undefined, { progress: updatedProgress });
      }

      return true;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating job progress');
      return false;
    }
  }

  /**
   * Complete a job
   */
  async completeJob(
    jobId: string,
    result: Json,
    status: EnrichmentJobStatus = EnrichmentJobStatus.COMPLETED
  ): Promise<boolean> {
    try {
      const updates: EnrichmentJobUpdate = {
        status,
        result_data: result,
        completed_at: new Date().toISOString(),
        locked_at: null,
        worker_id: null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        logger.error({ error: error.message || String(error) }, 'Failed to complete job');
        return false;
      }

      this.metrics.jobsProcessed++;
      this.metrics.lastProcessedAt = new Date();

      // Emit completion event
      if (this.config.enableEvents) {
        const eventType = status === EnrichmentJobStatus.COMPLETED 
          ? JobEventType.JOB_COMPLETED 
          : JobEventType.JOB_FAILED;
        this.emitJobEvent(eventType, jobId, undefined, { result });
      }

      return true;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error completing job');
      return false;
    }
  }

  /**
   * Fail a job and handle retry logic
   */
  async failJob(
    jobId: string,
    error: JobError,
    shouldRetry: boolean = true
  ): Promise<boolean> {
    try {
      // Get current job
      const { data: job, error: fetchError } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .select('retry_count, config')
        .eq('id', jobId)
        .single();

      if (fetchError || !job) {
        logger.error({ jobId }, 'Job not found for failure handling');
        return false;
      }

      const retryCount = job.retry_count + 1;
      const config = job.config as EnrichmentJobConfig;
      const maxRetries = config.maxRetries || this.config.maxRetries;

      let updates: EnrichmentJobUpdate;

      if (shouldRetry && retryCount <= maxRetries) {
        // Schedule retry
        const retryDelay = config.retryDelayMs * Math.pow(this.config.retryDelayMultiplier, retryCount - 1);
        const nextRetryAt = new Date(Date.now() + retryDelay);

        updates = {
          status: EnrichmentJobStatus.RETRYING,
          retry_count: retryCount,
          last_retry_at: new Date().toISOString(),
          next_retry_at: nextRetryAt.toISOString(),
          error_message: error.message,
          locked_at: null,
          worker_id: null,
          updated_at: new Date().toISOString()
        };

        // Emit retry event
        if (this.config.enableEvents) {
          this.emitJobEvent(JobEventType.JOB_RETRYING, jobId, undefined, { 
            retryCount, 
            nextRetryAt,
            error 
          });
        }
      } else {
        // Mark as permanently failed
        updates = {
          status: EnrichmentJobStatus.FAILED,
          retry_count: retryCount,
          error_message: error.message,
          completed_at: new Date().toISOString(),
          locked_at: null,
          worker_id: null,
          updated_at: new Date().toISOString()
        };

        this.metrics.jobsFailed++;

        // Emit failure event
        if (this.config.enableEvents) {
          this.emitJobEvent(JobEventType.JOB_FAILED, jobId, undefined, { error });
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .update(updates)
        .eq('id', jobId);

      if (updateError) {
        logger.error({ error: updateError.message || String(updateError) }, 'Failed to update failed job');
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error handling job failure');
      return false;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, userId?: string): Promise<QueueOperationResponse> {
    try {
      let query = supabaseAdmin
        .from('indb_enrichment_jobs')
        .update({
          status: EnrichmentJobStatus.CANCELLED,
          cancelled_at: new Date().toISOString(),
          locked_at: null,
          worker_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .in('status', [EnrichmentJobStatus.QUEUED, EnrichmentJobStatus.PROCESSING]);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error, count } = await query;

      if (error) {
        logger.error({ error: error.message || String(error) }, 'Failed to cancel job');
        return {
          success: false,
          error: 'Failed to cancel job'
        };
      }

      const success = (count || 0) > 0;
      
      if (success && this.config.enableEvents) {
        this.emitJobEvent(JobEventType.JOB_CANCELLED, jobId, userId);
      }

      return {
        success,
        affectedJobs: count || 0,
        message: success ? 'Job cancelled successfully' : 'Job not found or already processed'
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error cancelling job');
      return {
        success: false,
        error: 'Internal error occurred'
      };
    }
  }

  /**
   * Get job status and details
   */
  async getJobStatus(jobId: string, userId?: string): Promise<JobStatusResponse> {
    try {
      let query = supabaseAdmin
        .from('indb_enrichment_jobs')
        .select('*')
        .eq('id', jobId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      const job = this.recordToJob(data);

      return {
        success: true,
        job,
        progress: job.progress,
        result: job.result
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting job status');
      return {
        success: false,
        error: 'Internal error occurred'
      };
    }
  }

  /**
   * Get queue statistics - DISABLED (table doesn't exist)
   */
  async getQueueStats(): Promise<QueueStats> {
    // OLD COMPLEX SYSTEM - DISABLED 
    // Return mock stats since we're using simple keyword enrichment worker now
    return {
      totalJobs: 0,
      queuedJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      cancelledJobs: 0,
      averageProcessingTime: 0,
      throughput: 0,
      queueHealth: 'healthy' as const,
      oldestQueuedJob: undefined,
      workerStatus: {
        activeWorkers: 0,
        idleWorkers: 0,
        totalWorkers: 0
      }
    };

    /* COMMENTED OUT - CAUSES ERRORS WITH NON-EXISTENT TABLE
    try {
      // Get job counts by status
      const { data: statusCounts, error } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .select('status')
        .not('status', 'eq', EnrichmentJobStatus.CANCELLED);

      if (error) {
        logger.error({ error: error.message || String(error) }, 'Error fetching queue stats');
        throw error;
      }

      const counts = {
        total: statusCounts?.length || 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      };

      statusCounts?.forEach(job => {
        switch (job.status) {
          case EnrichmentJobStatus.QUEUED:
          case EnrichmentJobStatus.RETRYING:
            counts.queued++;
            break;
          case EnrichmentJobStatus.PROCESSING:
            counts.processing++;
            break;
          case EnrichmentJobStatus.COMPLETED:
            counts.completed++;
            break;
          case EnrichmentJobStatus.FAILED:
            counts.failed++;
            break;
          case EnrichmentJobStatus.CANCELLED:
            counts.cancelled++;
            break;
        }
      });

      // Get oldest queued job
      const { data: oldestJob } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .select('created_at')
        .eq('status', EnrichmentJobStatus.QUEUED)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      // Calculate averages and health
      const averageProcessingTime = this.metrics.jobsProcessed > 0 
        ? this.metrics.totalProcessingTime / this.metrics.jobsProcessed 
        : 0;

      const throughput = this.calculateThroughput();
      const queueHealth = this.assessQueueHealth(counts);

      return {
        totalJobs: counts.total,
        queuedJobs: counts.queued,
        processingJobs: counts.processing,
        completedJobs: counts.completed,
        failedJobs: counts.failed,
        cancelledJobs: counts.cancelled,
        averageProcessingTime,
        throughput,
        queueHealth,
        oldestQueuedJob: oldestJob ? new Date(oldestJob.created_at) : undefined,
        workerStatus: {
          activeWorkers: 0, // This would be populated by JobProcessor
          idleWorkers: 0,
          totalWorkers: 0
        }
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting queue stats');
      throw error;
    }
    */
  }

  /**
   * Pause the entire queue
   */
  async pauseQueue(): Promise<QueueOperationResponse> {
    try {
      // This would typically involve setting a global pause flag
      // For now, we'll emit an event that processors can listen to
      if (this.config.enableEvents) {
        this.emit('queue:paused');
      }

      return {
        success: true,
        message: 'Queue paused successfully'
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error pausing queue');
      return {
        success: false,
        error: 'Failed to pause queue'
      };
    }
  }

  /**
   * Resume the paused queue
   */
  async resumeQueue(): Promise<QueueOperationResponse> {
    try {
      if (this.config.enableEvents) {
        this.emit('queue:resumed');
      }

      return {
        success: true,
        message: 'Queue resumed successfully'
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error resuming queue');
      return {
        success: false,
        error: 'Failed to resume queue'
      };
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupCompletedJobs(olderThanDays: number = 30): Promise<QueueOperationResponse> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const { error, count } = await supabaseAdmin
        .from('indb_enrichment_jobs')
        .delete()
        .in('status', [EnrichmentJobStatus.COMPLETED, EnrichmentJobStatus.CANCELLED])
        .lt('completed_at', cutoffDate.toISOString());

      if (error) {
        logger.error({ error: error.message || String(error) }, 'Error cleaning up jobs');
        return {
          success: false,
          error: 'Failed to cleanup jobs'
        };
      }

      return {
        success: true,
        affectedJobs: count || 0,
        message: `Cleaned up ${count || 0} old jobs`
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in job cleanup');
      return {
        success: false,
        error: 'Internal error occurred'
      };
    }
  }

  /**
   * Get queue size
   */
  private async getQueueSize(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('indb_enrichment_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', [EnrichmentJobStatus.QUEUED, EnrichmentJobStatus.PROCESSING, EnrichmentJobStatus.RETRYING]);

    if (error) {
      logger.error({ error: error.message || String(error) }, 'Error getting queue size');
      return 0;
    }

    return count || 0;
  }

  /**
   * Validate job data
   */
  private validateJobData(jobRequest: EnqueueJobRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jobRequest.type) {
      errors.push('Job type is required');
    }

    if (!jobRequest.data) {
      errors.push('Job data is required');
    }

    // Type-specific validation
    switch (jobRequest.type) {
      case EnrichmentJobType.SINGLE_KEYWORD: {
        const singleData = jobRequest.data as SingleKeywordJobData;
        if (!singleData.keyword || !singleData.countryCode) {
          errors.push('Keyword and countryCode are required for single keyword jobs');
        }
        break;
      }

      case EnrichmentJobType.BULK_ENRICHMENT: {
        const bulkData = jobRequest.data as BulkEnrichmentJobData;
        if (!bulkData.keywords || !Array.isArray(bulkData.keywords) || bulkData.keywords.length === 0) {
          errors.push('Keywords array is required for bulk enrichment jobs');
        }
        break;
      }

      case EnrichmentJobType.CACHE_REFRESH: {
        const cacheData = jobRequest.data as CacheRefreshJobData;
        if (!cacheData.filterCriteria) {
          errors.push('Filter criteria is required for cache refresh jobs');
        }
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate total keywords for a job
   */
  private calculateTotalKeywords(data: EnrichmentJobData): number {
    if ('keyword' in data) {
      return 1;
    } else if ('keywords' in data) {
      return data.keywords.length;
    } else if ('filterCriteria' in data) {
      // For cache refresh, we'd need to query the database
      // For now, return a default estimate
      return 100;
    }
    return 0;
  }

  /**
   * Generate job name
   */
  private generateJobName(type: EnrichmentJobType, data: EnrichmentJobData): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    switch (type) {
      case EnrichmentJobType.SINGLE_KEYWORD: {
        const singleData = data as SingleKeywordJobData;
        return `Single: ${singleData.keyword} (${singleData.countryCode}) - ${timestamp}`;
      }
      
      case EnrichmentJobType.BULK_ENRICHMENT: {
        const bulkData = data as BulkEnrichmentJobData;
        return `Bulk: ${bulkData.keywords.length} keywords - ${timestamp}`;
      }
      
      case EnrichmentJobType.CACHE_REFRESH:
        return `Cache Refresh - ${timestamp}`;
      
      default:
        return `Enrichment Job - ${timestamp}`;
    }
  }

  /**
   * Get job queue position
   */
  private async getJobQueuePosition(jobId: string): Promise<number> {
    const { data: job } = await supabaseAdmin
      .from('indb_enrichment_jobs')
      .select('priority, created_at')
      .eq('id', jobId)
      .single();

    if (!job) return 0;

    const { count } = await supabaseAdmin
      .from('indb_enrichment_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', EnrichmentJobStatus.QUEUED)
      .or(`priority.gt.${job.priority},and(priority.eq.${job.priority},created_at.lt.${job.created_at})`);

    return (count || 0) + 1;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(totalKeywords: number, queuePosition: number): Date {
    const averageProcessingTime = this.metrics.jobsProcessed > 0 
      ? this.metrics.totalProcessingTime / this.metrics.jobsProcessed 
      : 60000; // Default 1 minute per keyword

    const estimatedWaitTime = queuePosition * averageProcessingTime;
    const estimatedProcessingTime = totalKeywords * (averageProcessingTime / 10); // Assume 10 keywords per job average

    return new Date(Date.now() + estimatedWaitTime + estimatedProcessingTime);
  }

  /**
   * Calculate throughput (jobs per hour)
   */
  private calculateThroughput(): number {
    if (!this.metrics.lastProcessedAt || this.metrics.jobsProcessed === 0) {
      return 0;
    }

    const hoursSinceStart = (Date.now() - this.metrics.lastProcessedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceStart > 0 ? this.metrics.jobsProcessed / hoursSinceStart : 0;
  }

  /**
   * Assess queue health
   */
  private assessQueueHealth(counts: { total: number; queued: number; processing: number; failed: number }): 'healthy' | 'degraded' | 'critical' {
    const totalActive = counts.queued + counts.processing;
    const failureRate = counts.total > 0 ? counts.failed / counts.total : 0;

    if (failureRate > 0.5 || totalActive > this.config.maxQueueSize * 0.9) {
      return 'critical';
    } else if (failureRate > 0.2 || totalActive > this.config.maxQueueSize * 0.7) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Convert database record to EnrichmentJob
   */
  private recordToJob(record: EnrichmentJobRecord): EnrichmentJob {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.job_type,
      status: record.status as EnrichmentJobStatus,
      priority: record.priority as JobPriority,
      config: record.config as EnrichmentJobConfig,
      data: record.source_data as EnrichmentJobData,
      progress: record.progress_data as JobProgress,
      result: record.result_data as Json,
      retryCount: record.retry_count,
      lastRetryAt: record.last_retry_at ? new Date(record.last_retry_at) : undefined,
      nextRetryAt: record.next_retry_at ? new Date(record.next_retry_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      startedAt: record.started_at ? new Date(record.started_at) : undefined,
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
      cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
      error: record.error_message || undefined,
      metadata: record.metadata as Record<string, Json> | undefined,
      workerId: record.worker_id || undefined,
      lockedAt: record.locked_at ? new Date(record.locked_at) : undefined
    };
  }

  /**
   * Emit job events
   */
  private emitJobEvent(type: JobEventType, jobId: string, userId?: string, data?: Json): void {
    if (!this.config.enableEvents) return;

    const event: JobEvent = {
      type,
      jobId,
      userId,
      timestamp: new Date(),
      data
    };

    this.emit('job:event', event);
  }

  /**
   * Create job table if it doesn't exist
   */
  private async createJobTable(): Promise<void> {
    // This would typically be handled by database migrations
    // For now, we assume the table exists
    logger.info({}, 'Job table check completed');
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupCompletedJobs();
      } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in scheduled cleanup');
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeatTimer(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.config.enableEvents) {
        this.emit('queue:heartbeat', {
          timestamp: new Date(),
          metrics: this.metrics,
          isRunning: this.isRunning
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Shutdown the queue
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    this.removeAllListeners();
    
    logger.info({}, 'EnrichmentQueue shutdown completed');
  }

  /**
   * IEnrichmentQueue implementation: Add keywords to enrichment queue
   */
  async enqueue(keywords: Array<{keyword: string; countryCode: string}>, priority?: 'high' | 'normal' | 'low'): Promise<string> {
    const jobPriorityMap = {
      'high': JobPriority.HIGH,
      'normal': JobPriority.NORMAL,
      'low': JobPriority.LOW
    };

    const response = await this.enqueueJob('system', {
      type: EnrichmentJobType.BULK_ENRICHMENT,
      data: { keywords },
      priority: priority ? jobPriorityMap[priority] : JobPriority.NORMAL
    });

    if (!response.success || !response.jobId) {
      throw new Error(response.error || 'Failed to enqueue keywords');
    }

    return response.jobId;
  }

  /**
   * IEnrichmentQueue implementation: Process next item in queue
   */
  async processNext(): Promise<boolean> {
    const job = await this.dequeueJob('system-worker');
    return !!job;
  }

  /**
   * IEnrichmentQueue implementation: Get queue status
   */
  async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await this.getQueueStats();
    return {
      total: stats.totalJobs,
      pending: stats.queuedJobs,
      processing: stats.processingJobs,
      completed: stats.completedJobs,
      failed: stats.failedJobs
    };
  }

  /**
   * IEnrichmentQueue implementation: Clear completed jobs
   */
  async clearCompleted(olderThanDays?: number): Promise<number> {
    const response = await this.cleanupCompletedJobs(olderThanDays);
    return response.affectedJobs || 0;
  }
}