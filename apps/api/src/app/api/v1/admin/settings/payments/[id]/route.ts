import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { type AdminUser } from '@indexnow/auth'
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  // Extract ID from URL path
  const id = request.url.split('/').filter(Boolean).pop() || ''
  const body = await request.json()

  // If setting as default, remove default from other gateways using secure wrapper
  if (body.is_default) {
    const resetDefaultContext = {
      userId: adminUser.id,
      operation: 'admin_reset_payment_gateway_defaults',
      reason: 'Admin setting new default payment gateway - resetting others',
      source: 'admin/settings/payments/[id]',
      metadata: {
        newDefaultGatewayId: id,
        endpoint: '/api/v1/admin/settings/payments/[id]'
      }
    }

    await SecureServiceRoleWrapper.executeSecureOperation(
      resetDefaultContext,
      {
        table: 'indb_payment_gateways',
        operationType: 'update',
        columns: ['is_default'],
        whereConditions: { 'id_neq': id },
        data: { is_default: false }
      },
      async () => {
        const { error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .update({ is_default: false })
          .neq('id', id)

        if (error) {
          throw new Error('Failed to reset default gateways')
        }

        return { success: true }
      }
    )
  }

  // Update the payment gateway using secure wrapper
  const updateGatewayContext = {
    userId: adminUser.id,
    operation: 'admin_update_payment_gateway',
    reason: 'Admin updating payment gateway configuration',
    source: 'admin/settings/payments/[id]',
    metadata: {
      gatewayId: id,
      updateData: {
        name: body.name,
        slug: body.slug,
        isActive: body.is_active,
        isDefault: body.is_default
      },
      endpoint: '/api/v1/admin/settings/payments/[id]'
    }
  }

  const updateData = {
    name: body.name,
    slug: body.slug,
    description: body.description,
    is_active: body.is_active,
    is_default: body.is_default,
    configuration: body.configuration || {},
    api_credentials: body.api_credentials || {},
    updated_at: new Date().toISOString()
  }

  try {
    const result = await SecureServiceRoleWrapper.executeSecureOperation(
      updateGatewayContext,
      {
        table: 'indb_payment_gateways',
        operationType: 'update',
        columns: Object.keys(updateData),
        whereConditions: { id },
        data: updateData
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          throw new Error('Failed to update payment gateway')
        }

        return data
      }
    )

    return formatSuccess({ gateway: result })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error.message : 'Failed to update payment gateway',
      { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
    )
    return formatError(structuredError)
  }
})

export const DELETE = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  // Extract ID from URL path
  const id = request.url.split('/').filter(Boolean).pop() || ''

  // Delete payment gateway using secure wrapper
  const deleteContext = {
    userId: adminUser.id,
    operation: 'admin_delete_payment_gateway',
    reason: 'Admin deleting payment gateway configuration',
    source: 'admin/settings/payments/[id]',
    metadata: {
      gatewayId: id,
      endpoint: '/api/v1/admin/settings/payments/[id]'
    }
  }

  try {
    await SecureServiceRoleWrapper.executeSecureOperation(
      deleteContext,
      {
        table: 'indb_payment_gateways',
        operationType: 'delete',
        whereConditions: { id }
      },
      async () => {
        const { error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error('Failed to delete payment gateway')
        }

        return { success: true }
      }
    )

    return formatSuccess({ success: true })
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error.message : 'Failed to delete payment gateway',
      { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
    )
    return formatError(structuredError)
  }
})
