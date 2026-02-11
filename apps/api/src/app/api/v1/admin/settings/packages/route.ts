/**
 * Admin Settings - Package Management API
 * GET /api/v1/admin/settings/packages - List all packages
 * POST /api/v1/admin/settings/packages - Create new package
 * 
 * Manages payment packages configuration
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
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
    billing_period?: string;
    is_active?: boolean;
    sort_order?: number;
}

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const packagesContext = {
            userId: adminUser.id,
            operation: 'admin_get_packages_settings',
            reason: 'Admin fetching packages for settings management',
            source: 'admin/settings/packages',
            metadata: {
                endpoint: '/api/v1/admin/settings/packages'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const packages = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow[]>(
            packagesContext,
            {
                table: 'indb_payment_packages',
                operationType: 'select',
                columns: ['*']
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_payment_packages')
                    .select('*')
                    .order('sort_order', { ascending: true });

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
        const body = await request.json() as CreatePackageRequest;

        // Validate required fields
        if (!body.name || !body.slug || body.price === undefined || body.daily_quota === undefined) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Package name, slug, price, and daily_quota are required',
                { severity: ErrorSeverity.LOW, statusCode: 400, userMessageKey: 'default' }
            );
            return formatError(validationError);
        }

        const createContext = {
            userId: adminUser.id,
            operation: 'admin_create_package',
            reason: `Admin creating new payment package: ${body.name}`,
            source: 'admin/settings/packages',
            metadata: {
                packageName: body.name,
                slug: body.slug,
                endpoint: '/api/v1/admin/settings/packages'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const newPackage = await SecureServiceRoleWrapper.executeSecureOperation<PaymentPackageRow>(
            createContext,
            {
                table: 'indb_payment_packages',
                operationType: 'insert'
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
                        sort_order: body.sort_order ?? 0
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
