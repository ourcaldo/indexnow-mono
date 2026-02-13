/**
 * SeRanking Health Check API Endpoint
 * GET /api/v1/integrations/seranking/health
 * 
 * Provides comprehensive health status of SeRanking integration
 * 
 * Note: The indb_seranking_integration table doesn't exist in the current schema.
 * This endpoint returns a stub response indicating the integration is not configured.
 * TODO: Create database migration for seranking integration table.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import { publicApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware';

interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured';
    response_time?: number;
    error_message?: string;
    last_check: string;
}

interface ComponentHealth {
    api_client: HealthCheckResult;
    database: HealthCheckResult;
    integration_settings: {
        status: 'healthy' | 'unhealthy' | 'unconfigured';
        is_configured: boolean;
        has_api_key: boolean;
        quota_available: boolean;
        error_message?: string;
        last_check: string;
    };
}

async function checkDatabaseHealth(checkTime: string): Promise<HealthCheckResult> {
    try {
        const startTime = Date.now();

        // Simple database health check - just verify we can query something
        await SecureServiceRoleWrapper.executeSecureOperation(
            {
                userId: 'system',
                operation: 'seranking_database_health_check',
                reason: 'SeRanking integration health check verifying database connectivity',
                source: 'integrations/seranking/health',
            },
            {
                table: 'indb_payment_packages',
                operationType: 'select',
                columns: ['id'],
            },
            async () => {
                const { error } = await supabaseAdmin
                    .from('indb_payment_packages')
                    .select('id')
                    .limit(1);

                if (error) {
                    throw new Error(error.message);
                }

                return { success: true };
            }
        );

        const responseTime = Date.now() - startTime;

        return { status: 'healthy', response_time: responseTime, last_check: checkTime };
    } catch (error) {
        return {
            status: 'unhealthy',
            error_message: error instanceof Error ? error.message : 'Database connection failed',
            last_check: checkTime
        };
    }
}

function determineOverallStatus(components: ComponentHealth): 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured' {
    // If integration is not configured, overall status is unconfigured
    if (components.integration_settings.status === 'unconfigured') {
        return 'unconfigured';
    }

    const statuses = [
        components.api_client.status,
        components.database.status,
        components.integration_settings.status
    ];

    if (statuses.includes('unhealthy')) {
        return 'unhealthy';
    }
    if (statuses.includes('degraded')) {
        return 'degraded';
    }
    return 'healthy';
}

function generateRecommendations(components: ComponentHealth): string[] {
    const recommendations: string[] = [];

    if (components.integration_settings.status === 'unconfigured') {
        recommendations.push('SeRanking integration is not configured. Set up the integration to enable rank tracking features.');
    }
    if (components.api_client.status === 'unhealthy') {
        recommendations.push('Check SeRanking API credentials and network connectivity');
    }
    if (components.database.status === 'unhealthy') {
        recommendations.push('Verify database connection');
    }

    return recommendations;
}

export const GET = publicApiWrapper(async (request: NextRequest) => {
    const checkTime = new Date().toISOString();

    // TODO: Check integration settings from database once indb_seranking_integration table is created
    // For now, return unconfigured status
    const isConfigured = false;

    const settingsHealth = {
        status: (isConfigured ? 'healthy' : 'unconfigured') as 'healthy' | 'unhealthy' | 'unconfigured',
        is_configured: isConfigured,
        has_api_key: false,
        quota_available: false,
        error_message: isConfigured ? undefined : 'SeRanking integration table not yet created',
        last_check: checkTime
    };

    // API client health (not configured if integration isn't set up)
    const apiHealth: HealthCheckResult = {
        status: 'unconfigured',
        error_message: 'Integration not configured',
        last_check: checkTime
    };

    // Check database health  
    const databaseHealth = await checkDatabaseHealth(checkTime);

    // Compile component statuses
    const components: ComponentHealth = {
        api_client: apiHealth,
        database: databaseHealth,
        integration_settings: settingsHealth
    };

    const overallStatus = determineOverallStatus(components);

    // Calculate summary
    const componentStatuses = [
        components.api_client.status,
        components.database.status,
        components.integration_settings.status
    ];

    const summary = {
        healthy_components: componentStatuses.filter(s => s === 'healthy').length,
        degraded_components: componentStatuses.filter(s => s === 'degraded').length,
        unhealthy_components: componentStatuses.filter(s => s === 'unhealthy').length,
        unconfigured_components: componentStatuses.filter(s => s === 'unconfigured').length,
        total_components: componentStatuses.length
    };

    const recommendations = generateRecommendations(components);

    return formatSuccess({
        status: overallStatus,
        overall_status: overallStatus,
        components,
        summary,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        message: isConfigured ? undefined : 'SeRanking integration is not configured. Database migration required.'
    });
});
