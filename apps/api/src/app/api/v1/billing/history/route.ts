import { NextRequest } from 'next/server';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { supabaseAdmin } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';

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
 * GET /api/v1/billing/history
 * Returns unified legacy + Paddle transaction history (paginated) with summary.
 * All computation is done DB-side via get_user_billing_history RPC
 * (one round-trip instead of the previous 6).
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
  const url = new URL(request.url);
  const page  = Math.max(1,   parseInt(url.searchParams.get('page')  ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')));
  const statusFilter = url.searchParams.get('status') ?? null;

  try {
    const { data: rpcResult, error: rpcError } = await (supabaseAdmin.rpc as Function)(
      'get_user_billing_history',
      {
        p_user_id: auth.userId,
        p_page:    page,
        p_limit:   limit,
        p_status:  statusFilter,
      }
    );

    if (rpcError) throw rpcError;

    const result = rpcResult as {
      transactions: unknown[];
      total_count:  number;
      summary:      BillingSummary;
    };

    const totalCount  = result.total_count ?? 0;
    const totalPages  = Math.ceil(totalCount / limit);

    const pagination: PaginationInfo = {
      current_page:  page,
      total_pages:   totalPages,
      total_items:   totalCount,
      items_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    return formatSuccess({
      transactions: result.transactions ?? [],
      summary:      result.summary,
      pagination,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/billing/history',
        method: 'GET',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});

