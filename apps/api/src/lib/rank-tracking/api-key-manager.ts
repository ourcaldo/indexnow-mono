/**
 * API Key Manager
 *
 * Unified gateway for ALL external service API keys.
 * Reads from indb_site_integration — the single source of truth
 * for third-party integrations (SeRanking, Firecrawl, etc.).
 *
 * Supports multiple keys per service with automatic rotation:
 *  - getActiveKey(service)  → picks the least-recently-used active key
 *  - markKeyFailed(service, apiKey, reason) → disables a key that returned errors
 *
 * Multiple rows with the same service_name are allowed (one API key per row).
 * Round-robin is based on last_used_at (ascending = least recently used first).
 */
import { supabaseAdmin } from '@indexnow/database';
import { logger } from '../monitoring/error-handling';

const adminClient = supabaseAdmin;

/** Shape returned by getActiveKeyWithId() for callers that need the row id */
export interface ApiKeyResult {
  id: string;
  apiKey: string;
  apiUrl: string | null;
}

export class ApiKeyManager {
  /**
   * Get an active API key for a service (simple string return).
   * Picks the least-recently-used active key when multiple exist.
   */
  static async getActiveKey(service: string): Promise<string | null> {
    const result = await this.getActiveKeyWithId(service);
    return result?.apiKey ?? null;
  }

  /**
   * Get an active API key WITH its row id and api_url.
   * Callers that need to call markKeyFailed() should use this to get the id.
   */
  static async getActiveKeyWithId(service: string): Promise<ApiKeyResult | null> {
    try {
      const { data, error } = await adminClient
        .from('indb_site_integration')
        .select('id, api_key, api_url')
        .eq('service_name', service)
        .eq('is_active', true)
        .order('last_used_at', { ascending: true, nullsFirst: true })
        .limit(1)
        .single();

      if (error || !data) {
        // PGRST116 = no rows found — not a crash-worthy error
        if (error && error.code !== 'PGRST116') {
          logger.error({ error, service }, 'Failed to fetch API key from indb_site_integration');
        }
        return null;
      }

      if (!data.api_key) {
        logger.warn({ service }, 'Integration row exists but api_key is empty');
        return null;
      }

      // Touch last_used_at so next call picks a different key (round-robin)
      await adminClient
        .from('indb_site_integration')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      return {
        id: data.id,
        apiKey: data.api_key,
        apiUrl: data.api_url ?? null,
      };
    } catch (error) {
      logger.error({ error, service }, 'Error in getActiveKeyWithId');
      return null;
    }
  }

  /**
   * Mark a key as failed — sets is_active = false and logs the reason.
   * Call this when an API responds with 401/403 (invalid key) or
   * repeated 429 (key burned through its quota).
   *
   * The next getActiveKey() call will pick a different active key.
   * If no active keys remain, getActiveKey() returns null.
   */
  static async markKeyFailed(
    service: string,
    integrationId: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await adminClient
        .from('indb_site_integration')
        .update({
          is_active: false,
          health_status: 'unhealthy',
          last_health_check: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .eq('service_name', service);

      if (error) {
        logger.error({ error, service, integrationId }, 'Failed to mark key as failed');
        return;
      }

      logger.warn(
        { service, integrationId, reason },
        `API key disabled for service "${service}": ${reason}`
      );
    } catch (error) {
      logger.error({ error, service, integrationId }, 'Error in markKeyFailed');
    }
  }

  /**
   * Count how many active keys remain for a service.
   * Useful for alerting when key pool is running low.
   */
  static async countActiveKeys(service: string): Promise<number> {
    try {
      const { count, error } = await adminClient
        .from('indb_site_integration')
        .select('id', { count: 'exact', head: true })
        .eq('service_name', service)
        .eq('is_active', true);

      if (error) {
        logger.error({ error, service }, 'Failed to count active keys');
        return 0;
      }

      return count ?? 0;
    } catch {
      return 0;
    }
  }
}
