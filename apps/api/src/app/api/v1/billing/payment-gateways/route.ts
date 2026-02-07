import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@indexnow/database';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    authenticatedApiWrapper,
    formatSuccess,
    formatError
} from '../../../../../../lib/core/api-response-middleware';
import { ErrorHandlingService } from '../../../../../../lib/monitoring/error-handling';

interface PaymentGateway {
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
    is_default: boolean;
}

/**
 * GET /api/v1/billing/payment-gateways
 * SECURITY FIX: This endpoint now requires authentication
 * Previously had NO authentication check - critical security vulnerability fixed
 */
export const GET = authenticatedApiWrapper(async (request: NextRequest, auth) => {
    // Fetch active payment gateways
    const { data: gateways, error } = await supabaseAdmin
        .from('indb_payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

    if (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error,
            {
                severity: ErrorSeverity.HIGH,
                userId: auth.userId,
                endpoint: '/api/v1/billing/payment-gateways',
                method: 'GET',
                statusCode: 500
            }
        );
        return formatError(structuredError);
    }

    return formatSuccess({
        gateways: (gateways || []) as PaymentGateway[]
    });
});
