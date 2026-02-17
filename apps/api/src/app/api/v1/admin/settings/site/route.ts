/**
 * Admin Site Settings API
 * GET /api/v1/admin/settings/site - Fetch site settings
 * PATCH /api/v1/admin/settings/site - Update site settings
 * 
 * Manages global site configuration including branding, contact info, and maintenance mode
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService, logger } from '@/lib/monitoring/error-handling';

const siteSettingsUpdateSchema = z.object({
    id: z.string().min(1, 'Settings ID is required'),
    site_name: z.string().max(255).optional(),
    site_description: z.string().max(1000).nullable().optional(),
    site_logo_url: z.string().url().nullable().optional(),
    site_icon_url: z.string().url().nullable().optional(),
    site_favicon_url: z.string().url().nullable().optional(),
    contact_email: z.string().email().nullable().optional(),
    support_email: z.string().email().nullable().optional(),
    maintenance_mode: z.boolean().optional(),
    registration_enabled: z.boolean().optional(),
}).strict();

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const settingsData = await SecureServiceRoleWrapper.executeSecureOperation(
            {
                userId: adminUser.id,
                operation: 'get_site_settings',
                source: 'admin/settings/site',
                reason: 'Admin fetching site settings configuration',
                metadata: {
                    endpoint: '/api/v1/admin/settings/site',
                    method: 'GET'
                },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_site_settings', operationType: 'select' },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_site_settings')
                    .select('*')
                    .single();

                if (error) {
                    throw new Error(`Failed to fetch site settings: ${error.message}`);
                }

                return data;
            }
        );

        return formatSuccess({ settings: settingsData });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.HIGH,
                userId: adminUser.id,
                endpoint: '/api/v1/admin/settings/site',
                method: 'GET',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});

export const PATCH = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const body = await request.json();

        // Validate with Zod schema — rejects unknown fields
        const validation = siteSettingsUpdateSchema.safeParse(body);
        if (!validation.success) {
            const validationError = await ErrorHandlingService.createError(
                ErrorType.VALIDATION,
                validation.error.issues[0]?.message || 'Invalid request body',
                { severity: ErrorSeverity.LOW, userId: adminUser.id, statusCode: 400 }
            );
            return formatError(validationError);
        }

        const {
            id,
            site_name,
            site_description,
            site_logo_url,
            site_icon_url,
            site_favicon_url,
            contact_email,
            support_email,
            maintenance_mode,
            registration_enabled
        } = validation.data;

        // Build update object with only provided fields
        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (site_name !== undefined) updatePayload.site_name = site_name;
        if (site_description !== undefined) updatePayload.site_description = site_description;
        if (site_logo_url !== undefined) updatePayload.site_logo_url = site_logo_url;
        if (site_icon_url !== undefined) updatePayload.site_icon_url = site_icon_url;
        if (site_favicon_url !== undefined) updatePayload.site_favicon_url = site_favicon_url;
        if (contact_email !== undefined) updatePayload.contact_email = contact_email;
        if (support_email !== undefined) updatePayload.support_email = support_email;
        if (maintenance_mode !== undefined) updatePayload.maintenance_mode = maintenance_mode;
        if (registration_enabled !== undefined) updatePayload.registration_enabled = registration_enabled;

        const updatedSettings = await SecureServiceRoleWrapper.executeSecureOperation(
            {
                userId: adminUser.id,
                operation: 'update_site_settings',
                source: 'admin/settings/site',
                reason: 'Admin updating site settings configuration',
                metadata: {
                    updatedFields: Object.keys(updatePayload).filter(key => key !== 'updated_at').join(', '),
                    endpoint: '/api/v1/admin/settings/site',
                    method: 'PATCH'
                },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') || undefined
            },
            { table: 'indb_site_settings', operationType: 'update' },
            async () => {
                const { data: settingsData, error } = await supabaseAdmin
                    .from('indb_site_settings')
                    .update(updatePayload)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    throw new Error(`Failed to update site settings: ${error.message}`);
                }

                return settingsData;
            }
        );

        logger.info({
            userId: adminUser.id,
            adminEmail: adminUser.email,
            updatedFields: Object.keys(updatePayload).filter(key => key !== 'updated_at')
        }, 'Site settings updated');

        return formatSuccess({ settings: updatedSettings });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            {
                severity: ErrorSeverity.HIGH,
                userId: adminUser.id,
                endpoint: '/api/v1/admin/settings/site',
                method: 'PATCH',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }
});
