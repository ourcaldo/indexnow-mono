import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database , getClientIP} from '@indexnow/shared';

// Derived types from Database schema
type PaymentTransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row'];
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
type PaymentGatewayRow = Database['public']['Tables']['indb_payment_gateways']['Row'];
type PaddleTransactionRow = Database['public']['Tables']['indb_paddle_transactions']['Row'];

// Transaction with joined package and gateway
type TransactionWithJoins = PaymentTransactionRow & {
    package: Pick<PaymentPackageRow, 'id' | 'name' | 'slug'> | null;
    gateway: Pick<PaymentGatewayRow, 'id' | 'name' | 'slug'> | null;
};

// Normalized billing transaction for frontend
interface NormalizedBillingTransaction {
    id: string;
    order_id: string;
    source: 'legacy' | 'paddle';
    transaction_type: string;
    transaction_status: PaymentTransactionRow['status'] | string;
    amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
    notes: string | null;
    proof_url: string | null;
    payment_method: string;
    external_transaction_id: string | null;
    package_name: string;
    billing_period: string;
    gateway_name: string;
    gateway_slug: string;
    paddle_transaction_id?: string | null;
}

// Summary statistics
interface BillingSummary {
    total_transactions: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    total_amount_spent: number;
}

// Pagination info
interface PaginationInfo {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
}

/**
 * Map legacy transaction to normalized format
 */
function mapLegacyTransaction(tx: TransactionWithJoins): NormalizedBillingTransaction {
    const packageName = tx.package?.name ?? 'Unknown Package';
    const gatewayName = tx.gateway?.name ?? 'Unknown Gateway';
    const gatewaySlug = tx.gateway?.slug ?? 'unknown';

    return {
        id: tx.id,
        order_id: tx.id,
        source: 'legacy',
        transaction_type: 'purchase',
        transaction_status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        notes: tx.notes,
        proof_url: tx.proof_url,
        payment_method: tx.payment_method ?? 'Unknown',
        external_transaction_id: tx.external_transaction_id,
        package_name: packageName,
        billing_period: (tx.metadata && typeof tx.metadata.billing_period === 'string') ? tx.metadata.billing_period : 'monthly',
        gateway_name: gatewayName,
        gateway_slug: gatewaySlug

    };
}

/**
 * Map Paddle transaction to normalized format
 */
function mapPaddleTransaction(tx: PaddleTransactionRow): NormalizedBillingTransaction {
    return {
        id: tx.id,
        order_id: tx.paddle_transaction_id,
        source: 'paddle',
        transaction_type: 'subscription',
        transaction_status: tx.status ?? 'completed',
        amount: tx.amount ?? 0,
        currency: 'USD',
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        notes: null,
        proof_url: null,
        payment_method: 'card',
        external_transaction_id: tx.paddle_transaction_id,
        package_name: 'Paddle Subscription',
        billing_period: 'monthly',
        gateway_name: 'Paddle',
        gateway_slug: 'paddle',
        paddle_transaction_id: tx.paddle_transaction_id
    };
}

/**
 * GET /api/v1/billing/history
 * Get user billing transaction history with pagination
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
    const statusFilter = url.searchParams.get('status');

    const offset = (page - 1) * limit;
    const MAX_RECORDS_PER_SOURCE = 500;

    try {
        // Fetch both legacy and paddle transactions in parallel
        const [legacyResult, paddleResult] = await Promise.all([
            // Legacy transactions
            SecureServiceRoleWrapper.executeWithUserSession<{ data: TransactionWithJoins[], count: number }>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_billing_history_legacy',
                    source: 'billing/history',
                    reason: 'User fetching their legacy billing transaction history',
                    metadata: { page, limit, status: statusFilter, endpoint: '/api/v1/billing/history' },
                    ipAddress: getClientIP(request),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async (db) => {
                    let query = db
                        .from('indb_payment_transactions')
                        .select(`
                            *,
                            package:indb_payment_packages(id, name, slug),
                            gateway:indb_payment_gateways(id, name, slug)
                        `, { count: 'exact' })
                        .eq('user_id', auth.userId);

                    if (statusFilter && ['pending', 'proof_uploaded', 'completed', 'failed', 'cancelled', 'refunded'].includes(statusFilter)) {
                        query = query.eq('status', statusFilter as PaymentTransactionRow['status']);
                    }

                    const { data, error, count } = await query
                        .order('created_at', { ascending: false })
                        .limit(MAX_RECORDS_PER_SOURCE);

                    if (error) throw error;
                    return { data: (data ?? []) as TransactionWithJoins[], count: count ?? 0 };
                }
            ),
            // Paddle transactions - Note: paddle_transactions doesn't have user_id, need to join through payment_transactions
            SecureServiceRoleWrapper.executeWithUserSession<{ data: PaddleTransactionRow[], count: number }>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_billing_history_paddle',
                    source: 'billing/history',
                    reason: 'User fetching their Paddle billing transaction history',
                    metadata: { page, limit, status: statusFilter, endpoint: '/api/v1/billing/history' },
                    ipAddress: getClientIP(request),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_paddle_transactions', operationType: 'select' },
                async (db) => {
                    // First get user's transaction IDs
                    const { data: userTransactions } = await db
                        .from('indb_payment_transactions')
                        .select('id')
                        .eq('user_id', auth.userId)
                        .order('created_at', { ascending: false })
                        .limit(MAX_RECORDS_PER_SOURCE);

                    if (!userTransactions || userTransactions.length === 0) {
                        return { data: [], count: 0 };
                    }

                    const transactionIds = userTransactions.map(t => t.id);

                    // Then get paddle transactions linked to those
                    const { data, error, count } = await db
                        .from('indb_paddle_transactions')
                        .select('*', { count: 'exact' })
                        .in('transaction_id', transactionIds)
                        .order('created_at', { ascending: false })
                        .limit(MAX_RECORDS_PER_SOURCE);

                    if (error) throw error;
                    return { data: (data ?? []) as PaddleTransactionRow[], count: count ?? 0 };
                }
            )
        ]);

        // Normalize transactions
        const normalizedLegacy = legacyResult.data.map(mapLegacyTransaction);
        const normalizedPaddle = paddleResult.data.map(mapPaddleTransaction);

        // Merge and sort by date
        const allTransactions = [...normalizedLegacy, ...normalizedPaddle]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Apply pagination
        const paginatedTransactions = allTransactions.slice(offset, offset + limit);
        const totalCount = allTransactions.length;

        // Calculate summary statistics using SQL counts (not in-memory filtering)
        const [completedCount, pendingCount, failedCount, totalAmountResult] = await Promise.all([
            SecureServiceRoleWrapper.executeWithUserSession<number>(
                auth.supabase,
                { userId: auth.userId, operation: 'billing_summary_completed', source: 'billing/history', reason: 'Count completed' },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async (db) => {
                    const { count } = await db.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('user_id', auth.userId).eq('status', 'completed');
                    return count ?? 0;
                }
            ),
            SecureServiceRoleWrapper.executeWithUserSession<number>(
                auth.supabase,
                { userId: auth.userId, operation: 'billing_summary_pending', source: 'billing/history', reason: 'Count pending' },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async (db) => {
                    const { count } = await db.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('user_id', auth.userId).eq('status', 'pending');
                    return count ?? 0;
                }
            ),
            SecureServiceRoleWrapper.executeWithUserSession<number>(
                auth.supabase,
                { userId: auth.userId, operation: 'billing_summary_failed', source: 'billing/history', reason: 'Count failed' },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async (db) => {
                    const { count } = await db.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('user_id', auth.userId).eq('status', 'failed');
                    return count ?? 0;
                }
            ),
            SecureServiceRoleWrapper.executeWithUserSession<number>(
                auth.supabase,
                { userId: auth.userId, operation: 'billing_summary_amount', source: 'billing/history', reason: 'Sum completed amount' },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async () => {
                    const { data, error } = await (supabaseAdmin.rpc as Function)('get_user_completed_amount', { p_user_id: auth.userId });
                    if (error) throw error;
                    return typeof data === 'number' ? data : Number(data) || 0;
                }
            ),
        ]);

        // Add paddle completed count to summary
        const paddleCompletedCount = normalizedPaddle.filter(t => t.transaction_status === 'completed').length;

        const summary: BillingSummary = {
            total_transactions: legacyResult.count + paddleResult.count,
            completed_transactions: completedCount + paddleCompletedCount,
            pending_transactions: pendingCount,
            failed_transactions: failedCount,
            total_amount_spent: totalAmountResult + normalizedPaddle
                .filter(t => t.transaction_status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
        };

        const totalPages = Math.ceil(totalCount / limit);
        const pagination: PaginationInfo = {
            current_page: page,
            total_pages: totalPages,
            total_items: totalCount,
            items_per_page: limit,
            has_next: page < totalPages,
            has_prev: page > 1
        };

        return formatSuccess({
            transactions: paginatedTransactions,
            summary,
            pagination
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/billing/history', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
