import { db as supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { logger } from '../monitoring/error-handling'

export class ApiKeyManager {
  /**
   * Get an active API key for a specific service
   */
  static async getActiveKey(service: string): Promise<string | null> {
    try {
      const { data, error } = await SecureServiceRoleWrapper.run(
        () => supabaseAdmin
          .from('indb_api_keys')
          .select('key_value')
          .eq('service_name', service)
          .eq('is_active', true)
          .order('last_used_at', { ascending: true })
          .limit(1)
          .single(),
        `Fetching active API key for ${service}`
      )

      if (error || !data) {
        logger.error({ error, service }, 'Failed to fetch API key')
        return null
      }

      // Update last used timestamp
      await SecureServiceRoleWrapper.run(
        () => supabaseAdmin
          .from('indb_api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('key_value', data.key_value),
        `Updating last_used_at for ${service} API key`
      )

      return data.key_value
    } catch (error) {
      logger.error({ error, service }, 'Error in getActiveKey')
      return null
    }
  }

  /**
   * Rotate to next available key (if multiple keys exist)
   */
  static async rotateKey(service: string, currentKey: string): Promise<string | null> {
    // Mark current key as potentially problematic or just update its last_used_at
    // so the next call to getActiveKey returns a different one
    await SecureServiceRoleWrapper.run(
      () => supabaseAdmin
        .from('indb_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_value', currentKey),
      `Rotating ${service} API key`
    )

    return this.getActiveKey(service)
  }
}
