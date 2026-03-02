import { SecureServiceRoleWrapper, supabaseAdmin, toJson, type Json } from '@indexnow/database';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { type AdminUser } from '@indexnow/auth';
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';

const updateGatewaySchema = z.object({
  name: z.string().max(255).optional(),
  slug: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  api_credentials: z.record(z.string(), z.unknown()).optional(),
});

export const PATCH = adminApiWrapper(
  async (request: NextRequest, adminUser: AdminUser, context) => {
    // Extract ID from route params
    const { id } = (await context.params) as Record<string, string>;
    const rawBody = await request.json();

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
        'set_default_payment_gateway_service',
        { p_gateway_id: id }
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
          isDefault: body.is_default,
        },
        endpoint: '/api/v1/admin/settings/payments/[id]',
      } as Record<string, Json>,
    };

    // Only include fields that were explicitly provided to avoid overwriting with undefined
    const updateData: Record<string, Json | string | boolean | null> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;
    if (body.configuration !== undefined) updateData.configuration = body.configuration as Json;
    if (body.api_credentials !== undefined) updateData.api_credentials = body.api_credentials as Json;

    try {
      const result = await SecureServiceRoleWrapper.executeSecureOperation(
        updateGatewayContext,
        {
          table: 'indb_payment_gateways',
          operationType: 'update',
          columns: Object.keys(updateData),
          whereConditions: { id },
          data: toJson(updateData),
        },
        async () => {
          const { data, error } = await supabaseAdmin
            .from('indb_payment_gateways')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) {
            throw new Error('Failed to update payment gateway');
          }

          return data;
        }
      );

      try {
        await ActivityLogger.logAdminAction(
          adminUser.id,
          'payment_gateway_update',
          undefined,
          `Updated payment gateway ${id}`,
          request,
          {
            targetType: 'payment_gateway',
            targetId: id,
            updatedFields: Object.keys(updateData),
          }
        );
      } catch (_) { /* non-critical */ }

      return formatSuccess({ gateway: result });
    } catch (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        error instanceof Error ? error.message : 'Failed to update payment gateway',
        { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
      );
      return formatError(structuredError);
    }
  }
);

export const DELETE = adminApiWrapper(
  async (request: NextRequest, adminUser: AdminUser, context) => {
    // Extract ID from route params
    const { id } = (await context.params) as Record<string, string>;

    // Delete payment gateway using secure wrapper
    const deleteContext = {
      userId: adminUser.id,
      operation: 'admin_delete_payment_gateway',
      reason: 'Admin deleting payment gateway configuration',
      source: 'admin/settings/payments/[id]',
      metadata: {
        gatewayId: id,
        endpoint: '/api/v1/admin/settings/payments/[id]',
      },
    };

    try {
      await SecureServiceRoleWrapper.executeSecureOperation(
        deleteContext,
        {
          table: 'indb_payment_gateways',
          operationType: 'delete',
          whereConditions: { id },
        },
        async () => {
          const { error } = await supabaseAdmin
            .from('indb_payment_gateways')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', id)
            .is('deleted_at', null);

          if (error) {
            throw new Error('Failed to delete payment gateway');
          }

          return { success: true };
        }
      );

      try {
        await ActivityLogger.logAdminAction(
          adminUser.id,
          'payment_gateway_delete',
          undefined,
          `Deleted payment gateway ${id}`,
          request,
          {
            targetType: 'payment_gateway',
            targetId: id,
          }
        );
      } catch (_) { /* non-critical */ }

      return formatSuccess({ success: true });
    } catch (error) {
      const structuredError = await ErrorHandlingService.createError(
        ErrorType.DATABASE,
        error instanceof Error ? error.message : 'Failed to delete payment gateway',
        { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
      );
      return formatError(structuredError);
    }
  }
);
