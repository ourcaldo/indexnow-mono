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
import { ErrorType, ErrorSeverity, getClientIP } from '@indexnow/shared';
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

// Use Pick from Database types for correct schema
type PaymentPackageRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  daily_quota: number;
  monthly_quota: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

interface CreatePackageRequest {
  name: string;
  slug: string;
  description?: string;
  price: number;
  daily_quota: number;
  billing_period?: 'monthly' | 'annual' | 'lifetime' | 'one-time';
  is_active?: boolean;
  sort_order?: number;
}

const createPackageSchema = z
  .object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
    price: z.number().nonnegative(),
    daily_quota: z.number().int().nonnegative(),
    billing_period: z.enum(['monthly', 'annual', 'lifetime', 'one-time']).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  try {
    const packagesContext = {
      userId: adminUser.id,
      operation: 'admin_get_packages_settings',
      reason: 'Admin fetching packages for settings management',
      source: 'admin/settings/packages',
      metadata: {
        endpoint: '/api/v1/admin/settings/packages',
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const packages = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow[]>(
      packagesContext,
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

    const createContext = {
      userId: adminUser.id,
      operation: 'admin_create_package',
      reason: `Admin creating new payment package: ${body.name}`,
      source: 'admin/settings/packages',
      metadata: {
        packageName: body.name,
        slug: body.slug,
        endpoint: '/api/v1/admin/settings/packages',
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const newPackage = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow>(
      createContext,
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
            price: body.price,
            daily_quota: body.daily_quota,
            currency: 'USD',
            billing_period: body.billing_period ?? 'monthly',
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
