/**
 * Payment Service Factory
 * Creates and configures payment service instances
 */

import { PaymentProcessor } from './core/PaymentProcessor'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { PaddleService } from './paddle'
import { Database } from '@indexnow/shared'

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
          columns: ['*'],
          whereConditions: { is_active: true }
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_gateways')
            .select('*')
            .eq('is_active', true)

          if (error) {
            throw new Error(`Failed to load payment gateways: ${error.message}`)
          }

          return data || []
        }
      )

      // Register each gateway
      for (const gateway of gateways || []) {
        await this.registerGateway(processor, gateway)
      }

    } catch (error) {
      console.error('Error initializing payment gateways:', error)
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
          console.warn(`Unknown payment gateway: ${config.slug}`)
      }
    } catch (error) {
      console.error(`Error registering ${config.slug} gateway:`, error)
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
        throw new Error('Paddle gateway is not properly configured')
      }

      // Initialize Paddle SDK instance
      await PaddleService.getInstance()
      
      console.log('✅ Paddle payment gateway initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Paddle gateway:', error)
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
