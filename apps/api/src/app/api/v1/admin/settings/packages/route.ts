/**
 * Admin Settings - Package Management API
 * GET /api/v1/admin/settings/packages - List all packages
 * POST /api/v1/admin/settings/packages - Create new package
 *
 * Manages payment packages configuration
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import { buildOperationContext } from '@/lib/services/build-operation-context';

// Use Pick from Database types for correct schema
type PaymentPackageRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

interface CreatePackageRequest {
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

const createPackageSchema = z
  .object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  try {
    const packages = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow[]>(
      buildOperationContext(request, adminUser.id, { operation: 'admin_get_packages_settings', source: 'admin/settings/packages', reason: 'Admin fetching packages for settings management' }),
      {
        table: 'indb_payment_packages',
        operationType: 'select',
        columns: ['*'],
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_packages')
          .select('*')
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
          .limit(50);

        if (error) {
          throw new Error(`Failed to fetch packages: ${error.message}`);
        }

        return data || [];
      }
    );

    return formatSuccess({ packages });
  } catch (error) {
    const systemError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { severity: ErrorSeverity.HIGH, statusCode: 500 }
    );
    return formatError(systemError);
  }
});

export const POST = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  try {
    const rawBody = await request.json();

    // Validate with Zod schema
    const validation = createPackageSchema.safeParse(rawBody);
    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0]?.message || 'Invalid request body',
        { severity: ErrorSeverity.LOW, statusCode: 400 }
      );
      return formatError(validationError);
    }

    const body = validation.data;

    const newPackage = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow>(
      buildOperationContext(request, adminUser.id, { operation: 'admin_create_package', source: 'admin/settings/packages', reason: `Admin creating new payment package: ${body.name}`, metadata: { packageName: body.name, slug: body.slug } }),
      {
        table: 'indb_payment_packages',
        operationType: 'insert',
      },
      async () => {
        const { data, error } = await supabaseAdmin
          .from('indb_payment_packages')
          .insert({
            name: body.name,
            slug: body.slug,
            description: body.description ?? null,
            is_active: body.is_active ?? false,
            sort_order: body.sort_order ?? 0,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create package: ${error.message}`);
        }

        return data;
      }
    );

    try {
      await ActivityLogger.logAdminAction(
        adminUser.id,
        'package_create',
        undefined,
        `Created package: ${newPackage.name}`,
        request,
        {
          targetType: 'package',
          targetId: newPackage.id,
          packageName: newPackage.name,
          packageSlug: newPackage.slug,
        }
      );
    } catch (logErr) {
      logger.warn({ err: logErr }, 'Activity log failed (non-critical)');
    }

    return formatSuccess({ package: newPackage }, undefined, 201);
  } catch (error) {
    const systemError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error : new Error(String(error)),
      { severity: ErrorSeverity.HIGH, statusCode: 500 }
    );
    return formatError(systemError);
  }
});
