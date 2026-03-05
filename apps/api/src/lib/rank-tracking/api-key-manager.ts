/**
 * API Key Manager
 *
 * Reads external service API keys from indb_site_integration (the single
 * source of truth for all third-party integrations: SeRanking, Firecrawl, etc.)
 *
 * Previously read from indb_api_keys — migrated for consistency.
 */
import { supabaseAdmin } from '@indexnow/database';
import { logger } from '../monitoring/error-handling';

const adminClient = supabaseAdmin;

export class ApiKeyManager {
  /**
   * Get an active API key for a specific service from indb_site_integration.
   * Matches rows where service_name = {service} AND is_active = true.
   */
  static async getActiveKey(service: string): Promise<string | null> {
    try {
      const { data, error } = await adminClient
        .from('indb_site_integration')
        .select('api_key')
        .eq('service_name', service)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        logger.error({ error, service }, 'Failed to fetch API key from indb_site_integration');
        return null;
      }

      if (!data.api_key) {
        logger.warn({ service }, 'Integration row exists but api_key is empty');
        return null;
      }

      return data.api_key;
    } catch (error) {
      logger.error({ error, service }, 'Error in getActiveKey');
      return null;
    }
  }
}
