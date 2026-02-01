/**
 * Abstract Payment Gateway Base Class
 * Defines the interface that all payment gateways must implement
 */

import { type Json } from '@indexnow/database'

export interface CustomerDetails {
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export interface PaymentRequest {
  order_id: string
  amount_usd: number
  currency: string
  customer_details: CustomerDetails
  item_details: {
    name: string
    description?: string
  }
  metadata?: Record<string, Json | undefined>
}

export interface PaymentResponse {
  transaction_id: string
  order_id: string
  status: string
  payment_url?: string
  redirect_url?: string
  token?: string
  saved_token_id?: string
  requires_redirect?: boolean
  metadata?: Record<string, Json | undefined>
}

export interface SubscriptionRequest {
  name: string
  amount_usd: number
  billing_period: 'monthly' | 'yearly'
  customer_details: CustomerDetails
  saved_token?: string
  start_date?: Date
  metadata?: Record<string, Json | undefined>
}

export interface SubscriptionResponse {
  subscription_id: string
  status: string
  next_billing_date?: string
  metadata?: Record<string, Json | undefined>
}

export abstract class PaymentGateway<TConfig = Record<string, Json>> {
  protected config: TConfig
  protected gatewayName: string

  constructor(config: TConfig, gatewayName: string) {
    this.config = config
    this.gatewayName = gatewayName
  }

  /**
   * Process a one-time payment
   */
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>

  /**
   * Create a recurring subscription
   */
  abstract createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse>

  /**
   * Get payment/transaction status
   */
  abstract getPaymentStatus(transactionId: string): Promise<PaymentResponse>

  /**
   * Get subscription status
   */
  abstract getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionResponse>

  /**
   * Cancel subscription
   */
  abstract cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }>

  /**
   * Validate webhook signature
   */
  abstract validateWebhook(payload: Json, signature: string): Promise<boolean>

  /**
   * Process webhook notification
   */
  abstract processWebhook(payload: Json): Promise<{ order_id: string; status: string; data: Json }>

  /**
   * Get gateway configuration
   */
  getConfig(): TConfig {
    return this.config
  }

  /**
   * Get gateway name
   */
  getGatewayName(): string {
    return this.gatewayName
  }
}