import { SecureServiceRoleWrapper, supabaseAdmin } from '@indexnow/database';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Json, Database } from '@indexnow/shared';
import { type AdminUser } from '@indexnow/auth';
import { adminApiWrapper, withDatabaseOperation } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';

const updatePackageSchema = z
  .object({
    name: z.string().max(255).optional(),
    slug: z.string().max(100).optional(),
    description: z.string().max(2000).nullable().optional(),
    currency: z.string().max(3).optional(),
    billing_period: z.string().max(50).optional(),
    features: z.array(z.string()).optional(),
    quota_limits: z.record(z.string(), z.unknown()).optional(),
    is_active: z.boolean().optional(),
    is_popular: z.boolean().optional(),
    sort_order: z.number().int().optional(),
    pricing_tiers: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

export const PATCH = adminApiWrapper(
  async (request: NextRequest, adminUser: AdminUser, context) => {
    // Extract ID from route params
    const { id } = (await context.params) as Record<string, string>;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const { formatError } = await import('@/lib/core/api-response-middleware');
      const { ErrorHandlingService } = await import('@/lib/monitoring/error-handling');
      const { ErrorType, ErrorSeverity } = await import('@indexnow/shared');
      return formatError(
        await ErrorHandlingService.createError(ErrorType.VALIDATION, 'Invalid JSON body', {
          severity: ErrorSeverity.LOW,
          userId: adminUser.id,
          statusCode: 400,
        })
      );
    }

    // Validate input
    const validation = updatePackageSchema.safeParse(body);
    if (!validation.success) {
      const { formatError } = await import('@/lib/core/api-response-middleware');
      const { ErrorHandlingService } = await import('@/lib/monitoring/error-handling');
      const { ErrorType, ErrorSeverity } = await import('@indexnow/shared');
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, userId: adminUser.id, statusCode: 400 }
      );
      return formatError(validationError);
    }

    // Update package using secure wrapper
    const validated = validation.data;
    const updateContext = {
      userId: adminUser.id,
      operation: 'admin_update_package',
      reason: 'Admin updating package configuration and settings',
      source: 'admin/settings/packages/[id]',
      metadata: {
        packageId: id,
        updateData: JSON.parse(
          JSON.stringify({
            name: validated.name,
            slug: validated.slug,
            isActive: validated.is_active,
            isPopular: validated.is_popular,
          })
        ),
        endpoint: '/api/v1/admin/settings/packages/[id]',
      },
    };

    const updateData = {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.slug !== undefined && { slug: validated.slug }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.currency !== undefined && { currency: validated.currency }),
      ...(validated.billing_period !== undefined && { billing_period: validated.billing_period }),
      features: validated.features || [],
      quota_limits: validated.quota_limits || {},
      ...(validated.is_active !== undefined && { is_active: validated.is_active }),
      ...(validated.is_popular !== undefined && { is_popular: validated.is_popular }),
      ...(validated.sort_order !== undefined && { sort_order: validated.sort_order }),
      pricing_tiers: validated.pricing_tiers || [],
      updated_at: new Date().toISOString(),
    };

    const result = await withDatabaseOperation(
      async () => {
        return await SecureServiceRoleWrapper.executeSecureOperation(
          updateContext,
          {
            table: 'indb_payment_packages',
            operationType: 'update',
            columns: Object.keys(updateData),
            whereConditions: { id },
            data: updateData as unknown as Json,
          },
          async () => {
            const { data, error } = await supabaseAdmin
              .from('indb_payment_packages')
              .update(updateData as never)
              .eq('id', id)
              .select()
              .single();

            if (error) {
              throw new Error(`Failed to update package: ${error.message}`);
            }

            return data;
          }
        );
      },
      { userId: adminUser.id, endpoint: '/api/v1/admin/settings/packages/[id]' }
    );

    if (result instanceof NextResponse) {
      return result;
    }

    return formatSuccess({ package: result.data }, undefined, 200);
  }
);

export const DELETE = adminApiWrapper(
  async (request: NextRequest, adminUser: AdminUser, context) => {
    // Extract ID from route params
    const { id } = (await context.params) as Record<string, string>;

    // Delete package using secure wrapper
    const deleteContext = {
      userId: adminUser.id,
      operation: 'admin_delete_package',
      reason: 'Admin deleting package configuration',
      source: 'admin/settings/packages/[id]',
      metadata: {
        packageId: id,
        endpoint: '/api/v1/admin/settings/packages/[id]',
      },
    };

    const result = await withDatabaseOperation(
      async () => {
        return await SecureServiceRoleWrapper.executeSecureOperation(
          deleteContext,
          {
            table: 'indb_payment_packages',
            operationType: 'delete',
            whereConditions: { id },
          },
          async () => {
            const { error } = await supabaseAdmin
              .from('indb_payment_packages')
              .update({ deleted_at: new Date().toISOString(), is_active: false })
              .eq('id', id)
              .is('deleted_at', null);

            if (error) {
              throw new Error(`Failed to delete package: ${error.message}`);
            }

            return { success: true };
          }
        );
      },
      { userId: adminUser.id, endpoint: '/api/v1/admin/settings/packages/[id]' }
    );

    if (result instanceof NextResponse) {
      return result;
    }

    return formatSuccess({ success: true }, undefined, 200);
  }
);
