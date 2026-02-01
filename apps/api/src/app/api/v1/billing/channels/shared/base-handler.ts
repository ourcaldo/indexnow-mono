import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/database'
import { logger, ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { formatSuccess, formatError, type ApiSuccessResponse, type ApiErrorResponse } from '@/lib/core/api-response-formatter'
import { type Json, type PaymentPackage } from '@indexnow/shared'

export interface PaymentData {
  package_id: string
  billing_period: string
  customer_info: CustomerInfo
  user: {
    id: string
    email: string
    [key: string]: Json | undefined
  }
  is_trial?: boolean
}

export interface CustomerInfo {
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  description?: string
}

export interface PaymentResult {
  success: boolean
  data?: Json
  message?: string
  requires_redirect?: boolean
  redirect_url?: string
}

export abstract class BasePaymentHandler {
  protected packageData: PaymentPackage | null = null
  protected userData: Json | null = null

  constructor(protected paymentData: PaymentData) {}

  // Common validation logic
  async validatePackage(): Promise<void> {
    const { data: packageData, error } = await supabaseAdmin
      .from('indb_payment_packages')
      .select('*')
      .eq('id', this.paymentData.package_id)
      .eq('is_active', true)
      .single()

    if (error || !packageData) {
      throw new Error('Package not found or inactive')
    }

    this.packageData = packageData
  }

  // Common transaction creation BEFORE payment processing
  async createPendingTransaction(gatewayId: string, additionalData: Record<string, Json> = {}): Promise<string> {
    const amount = this.calculateAmount()

    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('indb_payment_transactions')
      .insert({
        user_id: this.paymentData.user.id,
        package_id: this.paymentData.package_id,
        gateway_id: gatewayId,
        transaction_type: 'payment',
        transaction_status: 'pending',
        amount: amount.finalAmount,
        currency: amount.currency,
        payment_method: this.getPaymentMethodSlug(),
        billing_period: this.paymentData.billing_period,
        metadata: {
          original_amount: amount.originalAmount,
          original_currency: amount.originalCurrency,
          customer_info: this.paymentData.customer_info,
          user_id: this.paymentData.user.id,
          user_email: this.paymentData.user.email,
          package_id: this.paymentData.package_id,
          billing_period: this.paymentData.billing_period,
          created_at: new Date().toISOString(),
          payment_type: this.paymentData.is_trial ? 'trial_payment' : 'regular_payment',
          ...additionalData
        }
      })
      .select('id')
      .single()

    if (dbError || !transaction) {
      throw new Error('Failed to create transaction record')
    }

    return transaction.id
  }

  // Common amount calculation
  calculateAmount(): { originalAmount: number; finalAmount: number; currency: string; originalCurrency: string } {
    let amount = 0
    const { billing_period } = this.paymentData

    // Flat USD pricing structure (Paddle handles currency conversion)
    if (this.packageData.pricing_tiers?.[billing_period]) {
      const tier = this.packageData.pricing_tiers[billing_period]
      amount = tier.promo_price || tier.regular_price
    } else {
      amount = this.packageData.price || 0
    }

    if (amount === 0 && !this.paymentData.is_trial) {
      throw new Error('Unable to calculate package amount - no pricing found')
    }

    // For trial payments, keep original amount for subscription, but individual handlers will use $1 for charge
    const finalAmount = amount

    return {
      originalAmount: amount,
      originalCurrency: 'USD',
      finalAmount: finalAmount,
      currency: 'USD'
    }
  }

  // Abstract methods each payment channel must implement
  abstract getPaymentMethodSlug(): string
  abstract processPayment(): Promise<PaymentResult>

  // Main execution flow
  async execute(): Promise<ApiSuccessResponse<PaymentResult> | ApiErrorResponse> {
    try {
      await this.validatePackage()
      const result = await this.processPayment()

      return formatSuccess(result)

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error({ error: err.message }, `[${this.getPaymentMethodSlug()}] Error:`)
      
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.EXTERNAL_API,
        err,
        {
          severity: ErrorSeverity.HIGH,
          userId: this.paymentData.user.id,
          statusCode: 500,
          metadata: {
            payment_method: this.getPaymentMethodSlug(),
            package_id: this.paymentData.package_id
          },
          userMessageKey: 'default'
        }
      )
      return formatError(structuredError)
    }
  }
}