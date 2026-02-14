/**
 * Paddle Service - Core SDK Wrapper
 * Provides singleton instance of Paddle SDK and gateway configuration management
 */

import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared'

// Explicit type for gateway config to avoid never type inference
interface PaddleGatewayConfig {
  id: string
  slug: string
  is_active: boolean
  api_credentials: {
    api_key?: string
    [key: string]: unknown
  }
  configuration: {
    environment?: string
    [key: string]: unknown
  }
}

export class PaddleService {
  private static instance: Paddle | null = null

  /**
   * Get singleton instance of Paddle SDK
   * Initializes with API key from DATABASE (not environment variables)
   */
  static async getInstance(): Promise<Paddle> {
    if (this.instance) {
      return this.instance
    }

    // Get gateway configuration from database
    const gateway = await this.getGatewayConfig()

    if (!gateway) {
      throw ErrorHandlingService.createError({ message: 'Paddle gateway is not configured or inactive', type: ErrorType.SYSTEM, severity: ErrorSeverity.CRITICAL })
    }

    // CRITICAL: Get API key from DATABASE (not environment variables)
    const apiCredentials = gateway.api_credentials || {}
    const apiKey = apiCredentials.api_key

    if (!apiKey) {
      throw ErrorHandlingService.createError({ message: 'PADDLE API key not found in database. Please update indb_payment_gateways.api_credentials with actual API key.', type: ErrorType.SYSTEM, severity: ErrorSeverity.CRITICAL })
    }

    // Initialize Paddle SDK
    const envString = gateway.configuration?.environment || 'sandbox'
    const environment: Environment = envString === 'production' ? Environment.production : Environment.sandbox

    this.instance = new Paddle(apiKey, {
      environment,
    })

    return this.instance
  }

  /**
   * Get Paddle gateway configuration from database
   */
  static async getGatewayConfig(): Promise<PaddleGatewayConfig | null> {
    return SecureServiceRoleWrapper.executeSecureOperation<PaddleGatewayConfig | null>(
      {
        operation: 'get_paddle_gateway_config',
        reason: 'Loading Paddle payment gateway configuration',
        source: 'PaddleService',
        metadata: { gatewaySlug: 'paddle' }
      },
      { table: 'indb_payment_gateways', operationType: 'select' },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .select('id, slug, is_active, api_credentials, configuration')
          .eq('slug', 'paddle')
          .eq('is_active', true)
          .single()

        if (error) {
          throw ErrorHandlingService.createError({ message: `Failed to load Paddle gateway configuration: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH })
        }

        return data as PaddleGatewayConfig
      }
    )
  }

  /**
   * Reset instance (useful for testing)
   */
  static resetInstance(): void {
    this.instance = null
  }

  /**
   * Check if Paddle is configured and active
   * Verifies that API key is stored in database
   */
  static async isConfigured(): Promise<boolean> {
    try {
      const gateway = await this.getGatewayConfig()
      const apiCredentials = gateway?.api_credentials || {}
      const hasApiKey = !!apiCredentials.api_key
      return !!gateway && hasApiKey
    } catch (error) {
      return false
    }
  }
}

