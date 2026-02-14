/**
 * Payment Service Factory
 * Creates and configures payment service instances
 */

import { PaymentProcessor } from './core/PaymentProcessor'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { PaddleService } from './paddle'
import { Database, logger, ErrorHandlingService, ErrorType, ErrorSeverity } from '@indexnow/shared'

type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row']

export class PaymentServiceFactory {
  private static processor: PaymentProcessor | null = null

  /**
   * Get configured payment processor instance
   */
  static async getPaymentProcessor(): Promise<PaymentProcessor> {
    if (!this.processor) {
      this.processor = new PaymentProcessor()
      await this.initializeGateways(this.processor)
    }
    return this.processor
  }

  /**
   * Initialize and register payment gateways
   */
  private static async initializeGateways(processor: PaymentProcessor): Promise<void> {
    try {
      // Get active payment gateway configurations
      const gateways = await SecureServiceRoleWrapper.executeSecureOperation<PaymentGatewayRow[]>(
        {
          userId: 'system',
          operation: 'load_active_payment_gateways',
          reason: 'Loading active payment gateways for payment processor initialization',
          source: 'services/payments/PaymentServiceFactory',
          metadata: {
            operation_type: 'gateway_config_lookup'
          }
        },
        {
          table: 'indb_payment_gateways',
          operationType: 'select',
          columns: ['id', 'name', 'slug', 'is_active', 'is_default', 'api_credentials', 'configuration', 'created_at', 'updated_at'],
          whereConditions: { is_active: true }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_gateways')
            .select('id, name, slug, is_active, is_default, api_credentials, configuration, created_at, updated_at')
            .eq('is_active', true)

          if (error) {
            throw ErrorHandlingService.createError({ message: `Failed to load payment gateways: ${error.message}`, type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH })
          }

          return data || []
        }
      )

      // Register each gateway
      for (const gateway of gateways || []) {
        await this.registerGateway(processor, gateway)
      }

    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error initializing payment gateways')
    }
  }

  /**
   * Register individual gateway
   */
  private static async registerGateway(processor: PaymentProcessor, config: PaymentGatewayRow): Promise<void> {
    try {
      const gatewaySlug = config.slug.toLowerCase()

      switch (gatewaySlug) {
        case 'paddle':
          await this.initializePaddleGateway()
          break

        default:
          logger.warn(`Unknown payment gateway: ${config.slug}`)
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, `Error registering ${config.slug} gateway`)
    }
  }

  /**
   * Initialize Paddle gateway
   */
  private static async initializePaddleGateway(): Promise<void> {
    try {
      // Verify Paddle is configured
      const isConfigured = await PaddleService.isConfigured()

      if (!isConfigured) {
        throw ErrorHandlingService.createError({ message: 'Paddle gateway is not properly configured', type: ErrorType.SYSTEM, severity: ErrorSeverity.HIGH })
      }

      // Initialize Paddle SDK instance
      await PaddleService.getInstance()

      logger.info('Paddle payment gateway initialized successfully')
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to initialize Paddle gateway')
      throw error
    }
  }

  /**
   * Reset processor instance (useful for testing)
   */
  static resetProcessor(): void {
    this.processor = null
  }
}
