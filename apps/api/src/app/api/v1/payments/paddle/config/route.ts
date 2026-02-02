/**
 * Paddle Configuration API Route
 * Returns Paddle client-side configuration loaded from database
 * 
 * SECURITY: Only returns client_token (safe for frontend)
 * API key and webhook secret are NEVER exposed to frontend
 */

import { NextRequest } from 'next/server'
import { SecureServiceRoleWrapper } from '@indexnow/database'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware'

export const dynamic = 'force-dynamic'

export const GET = authenticatedApiWrapper(async (request, auth) => {
  try {
    // Load Paddle gateway configuration from database using SecureServiceRoleWrapper
    const gatewayResult = await SecureServiceRoleWrapper.executeWithUserSession(
      auth.supabase,
      {
        userId: auth.userId,
        operation: 'get_paddle_config',
        source: 'payments',
        reason: 'Fetching Paddle client configuration for checkout',
        metadata: { endpoint: '/api/v1/payments/paddle/config' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || undefined
      },
      { table: 'indb_payment_gateways', operationType: 'select' },
      async (db) => {
        const { data, error } = await db
          .from('indb_payment_gateways')
          .select('*')
          .eq('slug', 'paddle')
          .eq('is_active', true)
          .single()
        return { data, error }
      }
    )

    const { data: gateway, error } = gatewayResult

    if (error || !gateway) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        'Paddle gateway not found or not active',
        {
          severity: ErrorSeverity.MEDIUM,
          statusCode: 404,
          userId: auth.userId,
          metadata: { error: error?.message }
        }
      )
      
      return formatError(structuredError)
    }

    // Extract credentials from database
    const apiCredentials = (gateway.api_credentials as Record<string, any>) || {}
    const configuration = (gateway.configuration as Record<string, any>) || {}

    // CRITICAL: Only return client_token (safe for frontend)
    // NEVER expose api_key or webhook_secret to frontend
    const clientToken = apiCredentials.client_token

    if (!clientToken) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        'Paddle client token not found in database',
        {
          severity: ErrorSeverity.HIGH,
          statusCode: 500,
          userId: auth.userId,
          metadata: { 
            gateway_id: gateway.id,
            has_api_credentials: !!apiCredentials
          }
        }
      )

      return formatError(structuredError)
    }

    // Return safe configuration for frontend
    return formatSuccess({
      clientToken,
      environment: configuration.environment || 'sandbox',
      isActive: gateway.is_active,
      isDefault: gateway.is_default
    })

  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.EXTERNAL_API,
      error instanceof Error ? error.message : String(error),
      {
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        userId: auth.userId,
        metadata: { source: 'paddle_config_api' }
      }
    )

    return formatError(structuredError)
  }
})
