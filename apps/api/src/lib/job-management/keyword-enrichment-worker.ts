/**
 * Keyword Enrichment Background Worker
 * Checks user keywords and enriches them using SeRanking API.
 * Uses indb_rank_keywords and indb_keyword_bank tables.
 *
 * Three modes of operation (all via BullMQ):
 *   1. 'scheduled'      — hourly at :00, picks up keywords with keyword_bank_id IS NULL
 *   2. 'immediate'      — triggered on keyword creation, enriches specific keyword IDs
 *   3. 'stale-refresh'  — daily at 03:00 UTC, refreshes keyword_bank entries older than 30 days
 *
 * The BullMQ worker in queues/workers/keyword-enrichment.worker.ts
 * calls the appropriate method on each invocation.
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { KeywordBankService } from '../keyword-enrichment/services/KeywordBankService';
import { SeRankingApiClient } from '../keyword-enrichment/client/SeRankingApiClient';
import { KeywordEnrichmentService } from '../keyword-enrichment/services/KeywordEnrichmentService';
import { SeRankingErrorHandler } from '../keyword-enrichment/services/ErrorHandlingService';
import { IntegrationService } from '../keyword-enrichment/services/IntegrationService';
import { ApiKeyManager } from '../integrations/api-key-manager';
import { sleep } from '@indexnow/shared';
import { logger } from '@/lib/monitoring/error-handling';

interface KeywordToEnrich {
  id: string;
  user_id: string;
  keyword: string;
  country_id: string | null; // UUID FK to indb_keyword_countries
  keyword_bank_id: string | null;
  intelligence_updated_at: string | null;
}

export class KeywordEnrichmentWorker {
  private static instance: KeywordEnrichmentWorker | null = null;
  private isInitialized: boolean = false;

  private keywordBankService!: KeywordBankService;
  private enrichmentService!: KeywordEnrichmentService;
  private errorHandler!: SeRankingErrorHandler;
  private integrationService!: IntegrationService;

  private async initialize() {
    // Initialize services
    this.keywordBankService = new KeywordBankService();
    this.errorHandler = new SeRankingErrorHandler();

    // Initialize integration service to get API key from database
    this.integrationService = new IntegrationService(
      {
        defaultQuotaLimit: 1000,
        logLevel: 'info',
      },
      undefined
    ); // Fix: removed as any casting

    // Get API key via centralized ApiKeyManager (supports multi-key rotation)
    const keyResult = await ApiKeyManager.getActiveKeyWithId('seranking_keyword_export');
    const apiKey = keyResult?.apiKey ?? '';

    if (!apiKey) {
      logger.warn({}, 'Keyword Enrichment Worker: No SeRanking API key found in database');
    } else {
      logger.info({}, 'Keyword Enrichment Worker: Found SeRanking API key in database');
    }

    // Initialize SeRanking API client with API key from database
    const apiClient = new SeRankingApiClient({
      apiKey: apiKey,
      baseUrl: 'https://api.seranking.com',
      timeout: 30000,
    });

    // Initialize enrichment service with 30-day cache
    this.enrichmentService = new KeywordEnrichmentService(
      this.keywordBankService,
      apiClient,
      this.errorHandler,
      {
        cacheExpiryDays: 30,
        batchSize: 10, // Small batches to be gentle
        maxConcurrentRequests: 2,
      }
    );
  }

  private constructor() {
    // Constructor is now empty, initialization happens in initialize() method
  }

  static async getInstance(): Promise<KeywordEnrichmentWorker> {
    if (!KeywordEnrichmentWorker.instance) {
      KeywordEnrichmentWorker.instance = new KeywordEnrichmentWorker();
      await KeywordEnrichmentWorker.instance.initialize();
    }
    return KeywordEnrichmentWorker.instance;
  }

  /**
   * Ensure the worker is initialized and ready to process keywords.
   * Scheduling is handled by BullMQ — this method does NOT start a cron.
   */
  async ensureReady(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for enrichmentService to be ready
    while (!this.enrichmentService) {
      logger.debug({}, 'Keyword Enrichment: Waiting for service initialization');
      await sleep(100);
    }

    this.isInitialized = true;
    logger.info({}, 'Keyword Enrichment: Worker ready (BullMQ-scheduled)');
  }

  /**
   * Main processing function - find and enrich keywords
   */
  private async processKeywords(): Promise<void> {
    const jobId = `keyword-enrichment-${Date.now()}`;

    try {
      logger.info({ jobId }, 'Keyword Enrichment: Starting keyword processing');

      const keywordsToEnrich = await this.findKeywordsNeedingEnrichment();

      if (keywordsToEnrich.length === 0) {
        logger.debug({ jobId }, 'Keyword Enrichment: No keywords found needing enrichment');
        return;
      }

      let processed = 0;
      let successful = 0;

      for (const keyword of keywordsToEnrich) {
        try {
          await this.enrichKeyword(keyword);
          successful++;
          processed++;
          await sleep(500);
        } catch (error) {
          logger.error(
            {
              jobId,
              keyword: keyword.keyword,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Keyword Enrichment: Error processing keyword'
          );
          processed++;
        }
      }

      logger.info(
        { jobId, processed, successful, total: keywordsToEnrich.length },
        'Keyword Enrichment: Completed processing'
      );
    } catch (error) {
      logger.error(
        { jobId, error: error instanceof Error ? error.message : 'Unknown error' },
        'Keyword Enrichment: Job failed'
      );
    }
  }

  /**
   * Find keywords that need enrichment
   * Simple logic: get keywords from indb_rank_keywords where keyword_bank_id IS NULL
   */
  private async findKeywordsNeedingEnrichment(limit: number = 50): Promise<KeywordToEnrich[]> {
    try {
      logger.debug({ limit }, 'Keyword Enrichment: Finding keywords without keyword_bank_id');

      const data = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'find_keywords_needing_enrichment',
          reason: 'Finding keywords without keyword bank data for automated enrichment processing',
          source: 'job-management/keyword-enrichment-worker',
          metadata: {
            limit: limit,
            operation_type: 'keyword_enrichment_lookup',
          },
        },
        {
          table: 'indb_rank_keywords',
          operationType: 'select',
          columns: [
            'id',
            'user_id',
            'keyword',
            'country_id',
            'keyword_bank_id',
            'intelligence_updated_at',
          ],
          whereConditions: { keyword_bank_id: null },
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_rank_keywords')
            .select('id, user_id, keyword, country_id, keyword_bank_id, intelligence_updated_at')
            .is('keyword_bank_id', null) // Simple: get keywords that don't have bank reference
            .limit(limit);

          if (error) {
            throw new Error(`Failed to find keywords needing enrichment: ${error.message}`);
          }

          return (data || []) as KeywordToEnrich[];
        }
      );

      logger.info(
        { count: (data || []).length },
        'Keyword Enrichment: Found keywords without enrichment data'
      );
      return data || [];
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Keyword Enrichment: Error finding keywords'
      );
      return [];
    }
  }

  /**
   * Enrich a single keyword
   */
  private async enrichKeyword(keyword: KeywordToEnrich): Promise<void> {
    try {
      logger.debug({ keyword: keyword.keyword }, 'Keyword Enrichment: Enriching keyword');

      // Resolve country_id UUID → ISO2 code for enrichment service
      let countryCode: string | null = null;
      if (keyword.country_id) {
        const { data: countryRow } = await supabaseAdmin
          .from('indb_keyword_countries')
          .select('iso2_code')
          .eq('id', keyword.country_id)
          .single();
        countryCode = countryRow?.iso2_code ?? null;
      }

      if (!countryCode) {
        logger.error(
          { keyword: keyword.keyword },
          'Keyword Enrichment: No country code set for keyword'
        );
        return;
      }

      logger.debug(
        { country: countryCode, keyword: keyword.keyword },
        'Keyword Enrichment: Using country code'
      );

      // Use lowercase ISO2 code for KeywordBankService (it expects direct ISO2 codes like "id", "us")
      const countryCodeForBank = countryCode.toLowerCase();
      logger.debug({ countryCodeForBank }, 'Keyword Enrichment: Using country code');

      const result = await this.enrichmentService.enrichKeyword(
        keyword.keyword,
        countryCodeForBank
      );

      logger.debug(
        {
          keyword: keyword.keyword,
          success: result.success,
          hasData: !!result.data,
          dataFound: result.data?.is_data_found,
          search_volume: result.data?.search_volume,
          bankId: result.data?.id,
        },
        'Keyword Enrichment: Enrichment result'
      );

      if (result.success && result.data) {
        // Update the keyword record with bank_id reference only
        // SEO data (search_volume, cpc, etc.) is stored in keyword_bank and accessed via JOIN
        // We only need to link this keyword to the cache entry
        const updateData = {
          keyword_bank_id: result.data.id,
          intelligence_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        logger.debug(
          {
            keyword: keyword.keyword,
            bankId: result.data.id,
            isDataFound: result.data.is_data_found,
          },
          'Keyword Enrichment: Updating keyword'
        );

        await SecureServiceRoleWrapper.executeSecureOperation(
          {
            userId: 'system',
            operation: 'update_keyword_enrichment_data',
            reason: 'Linking keyword to enrichment data in keyword_bank',
            source: 'job-management/keyword-enrichment-worker',
            metadata: {
              keyword_id: keyword.id,
              keyword_text: keyword.keyword,
              keyword_bank_id: result.data.id,
              search_volume: result.data.search_volume,
              is_data_found: result.data.is_data_found,
              operation_type: 'keyword_enrichment_update',
            },
          },
          {
            table: 'indb_rank_keywords',
            operationType: 'update',
            whereConditions: { id: keyword.id },
            data: updateData,
          },
          async () => {
            const { error: updateError } = await supabaseAdmin
              .from('indb_rank_keywords')
              .update(updateData)
              .eq('id', keyword.id);

            if (updateError) {
              throw new Error(`Failed to update keyword enrichment data: ${updateError.message}`);
            }

            return { success: true };
          }
        );

        {
          if (result.data.is_data_found) {
            logger.info(
              { keyword: keyword.keyword, search_volume: result.data.search_volume },
              'Keyword Enrichment: Successfully enriched'
            );
          } else {
            logger.info(
              { keyword: keyword.keyword },
              'Keyword Enrichment: Successfully processed (no market data)'
            );
          }
        }
      } else {
        logger.error(
          {
            keyword: keyword.keyword,
            success: result.success,
            error: result.error,
            hasData: !!result.data,
          },
          'Keyword Enrichment: Failed to enrich keyword'
        );
      }
    } catch (error) {
      logger.error(
        {
          keyword: keyword.keyword,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Keyword Enrichment: Error enriching keyword'
      );
    }
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isInitialized: boolean;
    schedule: string;
    description: string;
  } {
    return {
      isInitialized: this.isInitialized,
      schedule: '0 * * * * (new keywords) | 0 3 * * * (stale refresh)',
      description: 'Enriches new keywords hourly at :00; refreshes stale data daily at 03:00 UTC',
    };
  }

  /**
   * Entry point for SCHEDULED mode — sweep for un-enriched keywords.
   * Called by BullMQ worker on each hourly invocation.
   */
  async runManually(): Promise<void> {
    await this.ensureReady();
    logger.info({}, 'Keyword Enrichment: Scheduled sweep triggered');
    await this.processKeywords();
    logger.info({}, 'Keyword Enrichment: Scheduled sweep completed');
  }

  /**
   * Entry point for IMMEDIATE mode — enrich specific keyword IDs right after creation.
   * Called by BullMQ worker when a keyword is added.
   */
  async enrichByIds(keywordIds: string[]): Promise<void> {
    await this.ensureReady();
    logger.info({ count: keywordIds.length }, 'Keyword Enrichment: Immediate enrichment triggered');

    const keywords = await this.findKeywordsByIds(keywordIds);
    if (keywords.length === 0) {
      logger.debug({ keywordIds }, 'Keyword Enrichment: No matching keywords found for immediate enrichment');
      return;
    }

    let successful = 0;
    for (const keyword of keywords) {
      try {
        await this.enrichKeyword(keyword);
        successful++;
        await sleep(500);
      } catch (error) {
        logger.error(
          { keyword: keyword.keyword, error: error instanceof Error ? error.message : 'Unknown error' },
          'Keyword Enrichment: Error in immediate enrichment'
        );
      }
    }

    logger.info({ processed: keywords.length, successful }, 'Keyword Enrichment: Immediate enrichment completed');
  }

  /**
   * Entry point for STALE-REFRESH mode — re-enrich keyword_bank entries older than 30 days.
   * Called by BullMQ worker on the daily 03:00 UTC schedule.
   */
  async refreshStale(): Promise<void> {
    await this.ensureReady();
    logger.info({}, 'Keyword Enrichment: Stale refresh triggered');

    const result = await this.enrichmentService.refreshStaleKeywords(50);
    if (result.success && result.data) {
      logger.info(
        { processed: result.data.processed, successful: result.data.successful, failed: result.data.failed },
        'Keyword Enrichment: Stale refresh completed'
      );
    } else {
      logger.error(
        { error: result.error },
        'Keyword Enrichment: Stale refresh failed'
      );
    }
  }

  /**
   * Find specific keywords by their IDs (for immediate enrichment)
   */
  private async findKeywordsByIds(keywordIds: string[]): Promise<KeywordToEnrich[]> {
    try {
      const data = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'find_keywords_by_ids_for_enrichment',
          reason: 'Finding specific keywords by ID for immediate enrichment after creation',
          source: 'job-management/keyword-enrichment-worker',
          metadata: {
            keyword_ids: keywordIds,
            count: keywordIds.length,
            operation_type: 'immediate_enrichment_lookup',
          },
        },
        {
          table: 'indb_rank_keywords',
          operationType: 'select',
          columns: ['id', 'user_id', 'keyword', 'country_id', 'keyword_bank_id', 'intelligence_updated_at'],
          whereConditions: { id_in: keywordIds },
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_rank_keywords')
            .select('id, user_id, keyword, country_id, keyword_bank_id, intelligence_updated_at')
            .in('id', keywordIds);

          if (error) {
            throw new Error(`Failed to find keywords by IDs: ${error.message}`);
          }

          return (data || []) as KeywordToEnrich[];
        }
      );

      return data || [];
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error', keywordIds },
        'Keyword Enrichment: Error finding keywords by IDs'
      );
      return [];
    }
  }
}

// Export singleton instance
export const keywordEnrichmentWorker = KeywordEnrichmentWorker.getInstance();
