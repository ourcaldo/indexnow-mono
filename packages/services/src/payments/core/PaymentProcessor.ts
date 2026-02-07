/**
 * Payment Processor - Main Payment Orchestrator
 * Handles payment routing, validation, and transaction management
 */

import { PaymentGateway, PaymentRequest, PaymentResponse, CustomerDetails } from './PaymentGateway'
import { PaymentValidator } from './PaymentValidator'
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database'
import { Database, DbPackageRow, DbTransactionRow, InsertTransaction, TransactionGatewayResponse, PackagePricingTiers, Json } from '@indexnow/shared'

export interface ProcessPaymentRequest {
  user_id: string
  package_id: string
  billing_period: 'monthly' | 'yearly'
  payment_method: string
  customer_info: CustomerDetails
  token_id?: string
}

export interface ProcessPaymentResponse {
  success: boolean
  transaction_id?: string
  order_id?: string
  redirect_url?: string
  requires_redirect?: boolean
  message?: string
  error?: string
}

type TransactionStatus = Database['public']['Tables']['indb_payment_transactions']['Row']['status']

export class PaymentProcessor {
  private gateways: Map<string, PaymentGateway> = new Map()
  private validator: PaymentValidator

  constructor() {
    this.validator = new PaymentValidator()
  }

  /**
   * Register a payment gateway
   */
  registerGateway(name: string, gateway: PaymentGateway): void {
    this.gateways.set(name, gateway)
  }

  /**
   * Get registered gateway
   */
  getGateway(name: string): PaymentGateway | undefined {
    return this.gateways.get(name)
  }

  /**
   * Process payment through appropriate gateway
   */
  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      // Validate request
      const validationResult = this.validator.validatePaymentRequest(request)
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error
        }
      }

      // Get package details
      const packageData = await this.getPackageDetails(request.package_id)
      if (!packageData) {
        return {
          success: false,
          error: 'Invalid package selected'
        }
      }

      // Calculate amount
      const amount = this.calculateAmount(packageData, request.billing_period)

      // Generate unique order ID
      const orderId = this.generateOrderId(request.user_id, request.payment_method)

      // Create transaction record
      const transaction = await this.createTransactionRecord({
        user_id: request.user_id,
        order_id: orderId,
        package_id: request.package_id,
        amount: amount,
        currency: packageData.currency || 'USD',
        billing_period: request.billing_period,
        payment_method: request.payment_method,
        customer_info: request.customer_info
      })

      if (!transaction) {
        return {
          success: false,
          error: 'Failed to create transaction record'
        }
      }

      // Determine gateway based on payment method
      const gatewayName = this.getGatewayName(request.payment_method)
      const gateway = this.getGateway(gatewayName)

      if (!gateway) {
        await this.updateTransactionStatus(transaction.id, 'failed', 'Gateway not available')
        return {
          success: false,
          error: 'Payment gateway not available'
        }
      }

      // Prepare payment request
      const paymentRequest: PaymentRequest = {
        order_id: orderId,
        amount_usd: amount,
        currency: packageData.currency || 'USD',
        customer_details: request.customer_info,
        item_details: {
          name: `${packageData.name} - ${request.billing_period}`,
          description: packageData.description || undefined
        },
        metadata: {
          user_id: request.user_id,
          package_id: request.package_id,
          billing_period: request.billing_period,
          token_id: request.token_id
        }
      }

      // Process payment through gateway
      const paymentResult = await gateway.processPayment(paymentRequest)

      // Update transaction with result
      await this.updateTransactionWithResult(transaction.id, paymentResult)

      return {
        success: true,
        transaction_id: paymentResult.transaction_id,
        order_id: orderId,
        redirect_url: paymentResult.redirect_url,
        requires_redirect: paymentResult.requires_redirect,
        message: 'Payment processed successfully'
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Payment processing error:', error)
      return {
        success: false,
        error: `Payment processing failed: ${errorMessage}`
      }
    }
  }

  /**
   * Get package details from database
   */
  private async getPackageDetails(packageId: string): Promise<DbPackageRow | null> {
    try {
      const packageData = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_payment_package_details',
          reason: 'Payment processor retrieving package details for payment processing',
          source: 'PaymentProcessor.getPackageDetails',
          metadata: {
            packageId,
            operation: 'select_active_package'
          }
        },
        { table: 'indb_payment_packages', operationType: 'select' },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_packages')
            .select('id, name, slug, description, price, currency, billing_period, daily_quota, monthly_quota, features, quota_limits, pricing_tiers, free_trial_enabled, is_active, is_popular, sort_order, paddle_price_id, stripe_price_id, created_at, updated_at')
            .eq('id', packageId)
            .eq('is_active', true)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          return data;
        }
      );

      return packageData;
    } catch (error) {
      console.error('Error fetching package details:', error)
      return null
    }
  }

  /**
   * Calculate payment amount based on package and billing period
   */
  private calculateAmount(packageData: DbPackageRow, billingPeriod: string): number {
    // Use flat USD pricing structure (Paddle handles currency conversion)
    const pricingTiers = packageData.pricing_tiers as unknown as PackagePricingTiers;
    if (pricingTiers?.[billingPeriod]) {
      const tierData = pricingTiers[billingPeriod]
      return tierData?.promo_price || tierData?.regular_price || 0
    }

    // If no pricing_tiers found, throw error
    throw new Error(`No pricing found for ${billingPeriod} billing period`)
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(userId: string, paymentMethod: string): string {
    const timestamp = Date.now()
    const method = paymentMethod.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4)
    const userPrefix = userId.substring(0, 8)
    return `${method}_${userPrefix}_${timestamp}`
  }

  /**
   * Create transaction record in database
   */
  private async createTransactionRecord(data: {
    user_id: string,
    package_id: string,
    amount: number,
    currency: string,
    payment_method: string,
    order_id: string,
    billing_period: string,
    customer_info: CustomerDetails
  }): Promise<DbTransactionRow | null> {
    try {
      const transaction = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'create_payment_transaction',
          reason: 'Payment processor creating new payment transaction record',
          source: 'PaymentProcessor.createTransactionRecord',
          metadata: {
            userId: data.user_id,
            packageId: data.package_id,
            orderId: data.order_id,
            amount: data.amount,
            paymentMethod: data.payment_method,
            billingPeriod: data.billing_period
          }
        },
        {
          table: 'indb_payment_transactions',
          operationType: 'insert',
          data: {
            user_id: data.user_id,
            package_id: data.package_id,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.payment_method,
            status: 'pending'
          }
        },
        async () => {
          const insertData: InsertTransaction = {
            user_id: data.user_id,
            package_id: data.package_id,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.payment_method,
            status: 'pending',
            metadata: {
              order_id: data.order_id,
              billing_period: data.billing_period,
              customer_info: data.customer_info as unknown as Json
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: transaction, error } = await supabaseAdmin
            .from('indb_payment_transactions')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return transaction;
        }
      );

      return transaction;
    } catch (error) {
      console.error('Error creating transaction record:', error)
      return null
    }
  }

  /**
   * Update transaction status
   */
  private async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    errorMessage?: string
  ): Promise<void> {
    try {
      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'update_payment_transaction_status',
          reason: 'Payment processor updating transaction status during payment flow',
          source: 'PaymentProcessor.updateTransactionStatus',
          metadata: {
            transactionId,
            newStatus: status,
            hasError: !!errorMessage,
            errorMessage: errorMessage || null
          }
        },
        {
          table: 'indb_payment_transactions',
          operationType: 'update',
          data: { status, error_message: errorMessage || null }
        },
        async () => {
          await supabaseAdmin
            .from('indb_payment_transactions')
            .update({
              status: status,
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', transactionId);

          return true;
        }
      );
    } catch (error) {
      console.error('Error updating transaction status:', error)
    }
  }

  /**
   * Update transaction with payment result
   */
  private async updateTransactionWithResult(
    transactionId: string,
    result: PaymentResponse
  ): Promise<void> {
    try {
      const gatewayResponse: TransactionGatewayResponse = {
        transaction_id: result.transaction_id,
        status: result.status,
        ...result.metadata
      };

      const status = this.mapPaymentStatus(result.status);

      await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'update_payment_transaction_with_gateway_result',
          reason: 'Payment processor updating transaction with gateway payment result and status',
          source: 'PaymentProcessor.updateTransactionWithResult',
          metadata: {
            transactionId,
            gatewayTransactionId: result.transaction_id,
            paymentStatus: result.status,
            mappedStatus: status,
            hasGatewayResponse: !!result
          }
        },
        {
          table: 'indb_payment_transactions',
          operationType: 'update',
          whereConditions: { id: transactionId },
          data: {
            transaction_id: result.transaction_id,
            status: status,
            gateway_response: gatewayResponse as unknown as Json,
            updated_at: new Date().toISOString()
          }
        },
        async () => {
          const { error } = await supabaseAdmin
            .from('indb_payment_transactions')
            .update({
              transaction_id: result.transaction_id,
              status: status,
              gateway_response: gatewayResponse as unknown as Json,
              updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)

          if (error) {
            throw new Error(`Failed to update transaction with result: ${error.message}`)
          }

          return { success: true }
        }
      )
    } catch (error) {
      console.error('Error updating transaction with result:', error)
    }
  }

  /**
   * Map payment status to internal status
   */
  private mapPaymentStatus(paymentStatus: string): TransactionStatus {
    switch (paymentStatus) {
      case 'capture':
      case 'settlement':
        return 'completed'
      case 'pending':
        return 'pending'
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        return 'failed'
      default:
        return 'pending'
    }
  }

  /**
   * Determine gateway name from payment method
   */
  private getGatewayName(paymentMethod: string): string {
    if (paymentMethod.includes('paddle')) {
      return 'paddle'
    }

    // Add more gateway mappings as needed
    return 'paddle' // Default fallback
  }
}
