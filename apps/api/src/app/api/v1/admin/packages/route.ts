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

interface Package {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
    [key: string]: unknown;
}

/**
 * GET /api/v1/admin/packages
 * Get all active packages - requires admin authentication
 */
export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const packagesContext = {
            userId: adminUser.id,
            operation: 'admin_get_active_packages',
            reason: 'Admin fetching all active packages for management',
            source: 'admin/packages',
            metadata: {
                endpoint: '/api/v1/admin/packages',
                filterActive: true
            }
        };

        const packages = await SecureServiceRoleWrapper.executeSecureOperation<Package[]>(
            packagesContext,
            {
                table: 'indb_payment_packages',
                operationType: 'select',
                columns: ['*'],
                whereConditions: { is_active: true }
            },
            async () => {
                const { data, error } = await supabaseAdmin
                    .from('indb_payment_packages')
                    .select('*')
                    .eq('is_active', true)
                    .is('deleted_at', null)
                    .order('sort_order', { ascending: true })
                    .limit(50);

                if (error) {
                    throw new Error(`Failed to fetch packages: ${error.message}`);
                }

                return data || [];
            }
        );

        return formatSuccess({ packages: packages || [] });
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});
