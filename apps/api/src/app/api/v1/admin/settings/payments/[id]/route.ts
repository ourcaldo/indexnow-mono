import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { type AdminUser } from '@indexnow/auth'
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

const updateGatewaySchema = z.object({
  name: z.string().max(255).optional(),
  slug: z.string().max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  api_credentials: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser, context?: { params: Promise<Record<string, string>> }) => {
  // Extract ID from route params
  if (!context) throw new Error('Missing route context');
  const { id } = await context.params;
  const rawBody = await request.json()

  // Validate input with Zod schema
  const validation = updateGatewaySchema.safeParse(rawBody);
  if (!validation.success) {
    const validationError = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      validation.error.issues[0]?.message || 'Invalid request body',
      { severity: ErrorSeverity.LOW, statusCode: 400 }
    );
    return formatError(validationError);
  }

  const body = validation.data;

  // If setting as default, atomically swap defaults using RPC
  if (body.is_default) {
    const { error: rpcError } = await (supabaseAdmin.rpc as Function)(
      'set_default_payment_gateway_service', { p_gateway_id: id }
    );

    if (rpcError) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        `Failed to set default gateway: ${rpcError.message}`,
        { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
      );
      return formatError(structuredError);
    }
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

export const DELETE = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser, context?: { params: Promise<Record<string, string>> }) => {
  // Extract ID from route params
  if (!context) throw new Error('Missing route context');
  const { id } = await context.params;

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
          .update({ deleted_at: new Date().toISOString(), is_active: false })
          .eq('id', id)
          .is('deleted_at', null)

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
