/**
 * Admin Users List API
 * GET /api/v1/admin/users
 * 
 * Returns list of all users with their profiles and package info
 */

import { NextRequest } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError
} from '@/lib/core/api-response-middleware';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    try {
        const { searchParams } = new URL(request.url);
        const parsedPage = parseInt(searchParams.get('page') || '1');
        const parsedLimit = parseInt(searchParams.get('limit') || '100');
        const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
        const limit = Number.isNaN(parsedLimit) ? 100 : Math.min(200, Math.max(1, parsedLimit));
        const offset = (page - 1) * limit;

        const usersContext = {
            userId: adminUser.id,
            operation: 'admin_get_users_list',
            reason: 'Admin fetching user list for management',
            source: 'admin/users',
            metadata: {
                endpoint: '/api/v1/admin/users',
                page,
                limit
            },
            ipAddress: getClientIP(request),
            userAgent: request.headers.get('user-agent') || undefined
        };

        const result = await SecureServiceRoleWrapper.executeSecureOperation(
            usersContext,
            {
                table: 'indb_auth_user_profiles',
                operationType: 'select',
                columns: ['*']
            },
            async () => {
                // Get total count and role breakdowns in parallel (#73 fix)
                const [totalCountResult, adminCountResult, superAdminCountResult, usersResult] = await Promise.all([
                    supabaseAdmin.from('indb_auth_user_profiles').select('*', { count: 'exact', head: true }),
                    supabaseAdmin.from('indb_auth_user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
                    supabaseAdmin.from('indb_auth_user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin'),
                    supabaseAdmin.from('indb_auth_user_profiles')
                        .select(`
                            *,
                            package:indb_payment_packages(
                                id,
                                name,
                                slug
                            )
                        `)
                        .order('created_at', { ascending: false })
                        .range(offset, offset + limit - 1)
                ]);

                const totalCount = totalCountResult.count;

                if (usersResult.error) {
                    throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
                }

                const users = usersResult.data || [];

                // Calculate summary using total counts (not just current page)
                const summary = {
                    totalUsers: totalCount || 0,
                    adminUsers: adminCountResult.count || 0,
                    superAdminUsers: superAdminCountResult.count || 0,
                    regularUsers: (totalCount || 0) - (adminCountResult.count || 0) - (superAdminCountResult.count || 0)
                };

                return { users, totalCount: totalCount || 0, summary, pagination: {
                    current_page: page,
                    total_pages: Math.ceil((totalCount || 0) / limit),
                    total_items: totalCount || 0,
                    items_per_page: limit,
                    has_next: offset + limit < (totalCount || 0),
                    has_prev: page > 1
                } };
            }
        );

        return formatSuccess(result);
    } catch (error) {
        const systemError = await ErrorHandlingService.createError(
            ErrorType.SYSTEM,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, statusCode: 500 }
        );
        return formatError(systemError);
    }
});
