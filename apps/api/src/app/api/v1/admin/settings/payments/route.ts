/**
 * Admin Settings - Payment Gateways API
 * GET /api/v1/admin/settings/payments - List all payment gateways
 * POST /api/v1/admin/settings/payments - Create new gateway
 * 
 * Manages payment gateway configuration (Paddle, etc.)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity, type Json } from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';

// Matches DB schema - no description column
type PaymentGatewayRow = {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    is_default: boolean;
    api_credentials: Json | null;
    configuration: Json | null;
    created_at: string;
    updated_at: string;
};

interface CreateGatewayRequest {
    name: string;
    slug: string;
    is_active?: boolean;
    is_default?: boolean;
    configuration?: Record<string, unknown>;
}

export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
    try {
        // Log access
        try {
            await ActivityLogger.logAdminAction(
                adminUser.id,
                'view_payment_gateways',
                undefined,
                'Accessed payment gateway settings',
                request,
                {
                    section: 'payment_gateways',
                    action: 'view_gateways',
                    adminEmail: adminUser.email || 'unknown'
                }
            );
        } catch (logError) {
            logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Failed to log gateway access');
        }

        const gatewaysContext = {
            userId: adminUser.id,
            operation: 'admin_get_payment_gateways',
            reason: 'Admin fetching payment gateways for settings',
            source: 'admin/settings/payments',
            metadata: {
                endpoint: '/api/v1/admin/settings/payments'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const gateways = await SecureServiceRoleWrapper.executeSecureOperation<PaymentGatewayRow[]>(
            gatewaysContext,
            {
                table: 'indb_payment_gateways',
                operationType: 'select',
                columns: ['*']
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_payment_gateways')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw new Error(`Failed to fetch gateways: ${error.message}`);
                }

                return data || [];
            }
        );

        return formatSuccess({ gateways });
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});

export const POST = adminApiWrapper(async (request: NextRequest, adminUser) => {
    try {
        const body = await request.json() as CreateGatewayRequest;

        // Validate required fields
        if (!body.name || !body.slug) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                'Gateway name and slug are required',
                { severity: ErrorSeverity.LOW, statusCode: 400, userMessageKey: 'default' }
            );
            return formatError(validationError);
        }

        const createContext = {
            userId: adminUser.id,
            operation: 'admin_create_payment_gateway',
            reason: `Admin creating new payment gateway: ${body.name}`,
            source: 'admin/settings/payments',
            metadata: {
                gatewayName: body.name,
                gatewaySlug: body.slug,
                isDefault: body.is_default || false,
                endpoint: '/api/v1/admin/settings/payments'
            },
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const gateway = await SecureServiceRoleWrapper.executeSecureOperation<PaymentGatewayRow>(
            createContext,
            {
                table: 'indb_payment_gateways',
                operationType: 'insert'
            },
            async () => {
                // If setting as default, unset other defaults first
                if (body.is_default) {
                    await supabaseAdmin
                        .from('indb_payment_gateways')
                        .update({ is_default: false })
                        .eq('is_default', true);
                }

                const { data, error } = await (supabaseAdmin
                    .from('indb_payment_gateways') as any)
                    .insert({
                        name: body.name,
                        slug: body.slug,
                        is_active: body.is_active ?? false,
                        is_default: body.is_default ?? false,
                        configuration: body.configuration ?? null
                    })
                    .select()
                    .single();

                if (error) {
                    throw new Error(`Failed to create gateway: ${error.message}`);
                }

                return data;
            }
        );

        // Log creation
        try {
            await ActivityLogger.logAdminAction(
                adminUser.id,
                'create_payment_gateway',
                undefined,
                `Created new payment gateway: ${gateway.name}`,
                request,
                {
                    section: 'payment_gateways',
                    action: 'create_gateway',
                    adminEmail: adminUser.email || 'unknown',
                    gatewayName: gateway.name,
                    gatewaySlug: gateway.slug,
                    isDefault: gateway.is_default
                }
            );
        } catch (logError) {
            logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Failed to log gateway creation');
        }

        return formatSuccess({ gateway }, undefined, 201);
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});
