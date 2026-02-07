import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../lib/monitoring/error-handling';

/**
 * POST /api/debug/payment-result
 * Debug endpoint for payment result testing in development
 */
export async function POST(request: NextRequest) {
    try {
        const { payment_method, result } = await request.json();

        // Sanitize sensitive data in logs
        const sanitizedResult = {
            ...result,
            // Remove sensitive payment details if present
            card_number: result.card_number ? '****' + result.card_number?.slice(-4) : undefined,
            cvv: result.cvv ? '***' : undefined,
            bank_account: result.bank_account ? '****' + result.bank_account?.slice(-4) : undefined
        };

        logger.info({
            payment_method,
            result: JSON.stringify(sanitizedResult, null, 2),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        }, '[DEBUG] Payment result received');

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Debug payment result error');
        return NextResponse.json({ success: false, error: 'Debug failed' }, { status: 500 });
    }
}
