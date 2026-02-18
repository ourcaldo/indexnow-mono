import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { type AdminUser } from '@indexnow/auth'
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser, context) => {
  // Extract ID from route params
  const { id } = await context.params as Record<string, string>;

  try {
    // Atomic RPC: unsets all other defaults + sets this one, in a single transaction
    const result = await SecureServiceRoleWrapper.executeSecureOperation(
      {
        userId: adminUser.id,
        operation: 'admin_set_payment_gateway_as_default',
        reason: 'Admin setting specific payment gateway as the default (atomic)',
        source: 'admin/settings/payments/[id]/default',
        metadata: {
          defaultGatewayId: id,
          endpoint: '/api/v1/admin/settings/payments/[id]/default'
        },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined
      },
      {
        table: 'indb_payment_gateways',
        operationType: 'update',
        columns: ['is_default', 'updated_at'],
        whereConditions: { id },
        data: { is_default: true }
      },
      async () => {
        // Atomic: reset all defaults + set new default in one transaction
        const { error: rpcError } = await (supabaseAdmin.rpc as Function)(
          'set_default_payment_gateway_service', { p_gateway_id: id }
        );

        if (rpcError) throw new Error(`Failed to set default gateway: ${rpcError.message}`);

        // Fetch updated gateway for response
        const { data, error } = await supabaseAdmin
          .from('indb_payment_gateways')
          .select()
          .eq('id', id)
          .single();

        if (error) throw new Error(`Failed to fetch updated gateway: ${error.message}`);
        return data;
      }
    );

    return formatSuccess({ gateway: result });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error.message : 'Failed to update default gateway',
      { severity: ErrorSeverity.MEDIUM, statusCode: 500 }
    )
    return formatError(structuredError)
  }
})
