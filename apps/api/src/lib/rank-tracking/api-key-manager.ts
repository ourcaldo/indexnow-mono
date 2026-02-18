import { supabaseAdmin } from '@indexnow/database';
import { logger } from '../monitoring/error-handling';

const adminClient = supabaseAdmin;

export class ApiKeyManager {
  /**
   * Get an active API key for a specific service
   */
  static async getActiveKey(service: string): Promise<string | null> {
    try {
      const { data, error } = await adminClient
        .from('indb_api_keys')
        .select('key_value')
        .eq('service_name', service)
        .eq('is_active', true)
        .order('last_used_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        logger.error({ error, service }, 'Failed to fetch API key');
        return null;
      }

      // Update last used timestamp
      await adminClient
        .from('indb_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_value', data.key_value);

      return data.key_value;
    } catch (error) {
      logger.error({ error, service }, 'Error in getActiveKey');
      return null;
    }
  }

  /**
   * Rotate to next available key (if multiple keys exist)
   */
  static async rotateKey(service: string, currentKey: string): Promise<string | null> {
    await adminClient
      .from('indb_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_value', currentKey);

    return this.getActiveKey(service);
  }
}
