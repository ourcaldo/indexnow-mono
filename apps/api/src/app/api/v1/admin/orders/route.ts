import { NextRequest, NextResponse } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import {
  type AdminOrdersResponse,
  type AdminOrderTransaction,
  type AdminOrderSummary,
  escapeLikePattern
} from '@indexnow/shared';
import {
  SecureServiceRoleWrapper,
  supabaseAdmin,
  type Json
} from '@indexnow/database';
import { batchGetUserEmails } from '@/lib/core/batch-user-emails';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
  const status = searchParams.get('status') || undefined;
  const customer = searchParams.get('customer') || undefined;
  const packageId = searchParams.get('package_id') || undefined;
  const dateFrom = searchParams.get('date_from') || undefined;
  const dateTo = searchParams.get('date_to') || undefined;
  const amountMin = searchParams.get('amount_min') || undefined;
  const amountMax = searchParams.get('amount_max') || undefined;

  // Log admin order management access
  // Using generic logAdminAction if logAdminDashboardActivity is not available
  try {
    await ActivityLogger.logAdminAction(
      adminUser.id,
      'view_orders',
      undefined,
      'Accessed order management interface',
      request,
      {
        section: 'order_management',
        adminUser: adminUser.email
      }
    );
  } catch (logError) {
    logger.error({ error: logError }, 'Failed to log admin order activity');
  }

  const offset = (page - 1) * limit;

  // Get orders using secure wrapper
  const ordersContext = {
    userId: adminUser.id,
    operation: 'admin_get_orders_list',
    reason: 'Admin fetching orders list with filters and pagination',
    source: 'admin/orders',
    metadata: {
      filters: {
        status: status ?? null,
        customer: customer ?? null,
        packageId: packageId ?? null,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
        amountMin: amountMin ?? null,
        amountMax: amountMax ?? null
      },
      pagination: { page, limit }
    } as Record<string, Json>
  };

  const ordersResult = await SecureServiceRoleWrapper.executeSecureOperation(
    ordersContext,
    {
      table: 'indb_payment_transactions',
      operationType: 'select',
      columns: ['*', 'package', 'gateway']
    },
    async () => {
      // Pre-filter user IDs when customer search is active (pushes filter into SQL)
      let customerUserIds: string[] | null = null;
      if (customer) {
        const customerLower = customer.toLowerCase();
        const escapedCustomer = escapeLikePattern(customerLower);
        // Search profiles by name
        const { data: matchingProfiles } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id')
          .ilike('full_name', `%${escapedCustomer}%`)
          .limit(200);
        const profileMatches = new Set((matchingProfiles || []).map(p => p.user_id));

        // Search emails via batch RPC — limit to reasonable subset
        const { data: allProfiles } = await supabaseAdmin
          .from('indb_auth_user_profiles')
          .select('user_id')
          .limit(500);
        if (allProfiles && allProfiles.length > 0) {
          const allUserIds = allProfiles.map(p => p.user_id);
          const emailMap = await batchGetUserEmails(allUserIds);
          emailMap.forEach((email, uid) => {
            if (email.toLowerCase().includes(customerLower)) {
              profileMatches.add(uid);
            }
          });
        }

        customerUserIds = [...profileMatches];
        if (customerUserIds.length === 0) {
          // No matching users — return empty immediately
          return { orders: [], count: 0 };
        }
      }

      // Build base query
      let query = supabaseAdmin
        .from('indb_payment_transactions')
        .select(`
  *,
  package: indb_payment_packages(
    id,
    name,
    slug,
    description,
    price,
    currency,
    billing_period,
    features,
    pricing_tiers
  ),
    gateway: indb_payment_gateways(
      id,
      name,
      slug
    )
      `, { count: 'exact' });

      // Apply customer filter at SQL level
      if (customerUserIds) {
        query = query.in('user_id', customerUserIds);
      }

      // Apply filters
      if (status) {
        query = query.eq('status', status as 'pending' | 'failed' | 'proof_uploaded' | 'completed' | 'cancelled' | 'refunded');
      }

      if (packageId) {
        query = query.eq('package_id', packageId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      if (amountMin) {
        query = query.gte('amount', parseFloat(amountMin));
      }

      if (amountMax) {
        query = query.lte('amount', parseFloat(amountMax));
      }

      // Execute query with pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { orders: data, count };
    }
  );

  const { orders, count } = ordersResult as { orders: Record<string, unknown>[], count: number }; // Casting briefly to handle joins which are not in strict Row type

  if (!orders) {
    return formatSuccess({
      orders: [],
      summary: {
        total_orders: 0,
        pending_orders: 0,
        proof_uploaded_orders: 0,
        completed_orders: 0,
        failed_orders: 0,
        total_revenue: 0,
        recent_activity: 0
      },
      pagination: {
        current_page: page,
        total_pages: 0,
        total_items: 0,
        items_per_page: limit,
        has_next: false,
        has_prev: false
      }
    });
  }

  // Fetch user profiles and auth data (Bulk Fetch Optimization)
  const enrichedOrders: AdminOrderTransaction[] = [];

  // 1. Collect all IDs
  const userIds = new Set<string>();
  const verifierIds = new Set<string>();

  orders.forEach(order => {
    if (order.user_id) userIds.add(order.user_id);
    if (order.verified_by) verifierIds.add(order.verified_by);
  });

  const allProfileIds = [...new Set([...userIds, ...verifierIds])];
  const profileMap = new Map<string, Record<string, unknown>>();
  const emailMap = new Map<string, string>();

  // 2. Bulk fetch profiles
  if (allProfileIds.length > 0) {
    try {
      const profiles = await SecureServiceRoleWrapper.executeSecureOperation(
        { ...ordersContext, operation: 'admin_enrich_orders_profiles' },
        {
          table: 'indb_auth_user_profiles',
          operationType: 'select',
          columns: ['user_id', 'full_name', 'role', 'created_at'],
        },
        async () => {
          const { data } = await supabaseAdmin
            .from('indb_auth_user_profiles')
            .select('user_id, full_name, role, created_at')
            .in('user_id', allProfileIds)
            .limit(200);
          return data;
        }
      );
      profiles?.forEach(p => profileMap.set(p.user_id, p));
    } catch (e) {
      logger.error({ error: e }, 'Failed to bulk fetch profiles');
    }
  }

  // 3. Batch fetch emails (single RPC call instead of N individual lookups)
  if (allProfileIds.length > 0) {
    const emails = await batchGetUserEmails(allProfileIds);
    emails.forEach((email, uid) => emailMap.set(uid, email));
  }

  // 4. Build enriched orders
  for (const order of orders) {
    const userProfile = order.user_id ? profileMap.get(order.user_id) : null;
    const verifierProfile = order.verified_by ? profileMap.get(order.verified_by) : null;
    const userEmail = order.user_id ? emailMap.get(order.user_id) : null;

    const enrichedOrder: AdminOrderTransaction = {
      ...order,
      transaction_status: order.status, // Map status to transaction_status
      transaction_type: order.transaction_type || 'payment', // Default if missing
      gateway_transaction_id: order.external_transaction_id || order.gateway_transaction_id, // Map external id
      user: {
        user_id: order.user_id,
        full_name: userProfile?.full_name || 'Unknown User',
        role: userProfile?.role || 'user',
        email: userEmail || 'N/A',
        created_at: userProfile?.created_at || order.created_at
      },
      verifier: verifierProfile ? {
        user_id: order.verified_by,
        full_name: verifierProfile.full_name || 'Unknown',
        role: verifierProfile.role || 'admin'
      } : null,
      package: order.package,
      gateway: order.gateway
    };

    enrichedOrders.push(enrichedOrder);
  }

  // Calculate summary using database-level aggregation (not full-table scan)
  const summaryContext = { ...ordersContext, operation: 'admin_get_orders_summary' };
  const summaryResult = await SecureServiceRoleWrapper.executeSecureOperation(
    summaryContext,
    { table: 'indb_payment_transactions', operationType: 'select', columns: ['status', 'amount'] },
    async () => {
      // Fetch counts per status using separate filtered count queries
      const [pending, proofUploaded, completed, failed, revenueResult, recentResult] = await Promise.all([
        supabaseAdmin.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'proof_uploaded'),
        supabaseAdmin.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabaseAdmin.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        // Revenue total via RPC (avoids fetching all completed transactions)
        (supabaseAdmin.rpc as Function)('get_total_revenue'),
        supabaseAdmin.from('indb_payment_transactions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const totalRevenue = typeof revenueResult.data === 'number' ? revenueResult.data : Number(revenueResult.data) || 0;

      return {
        total_orders: (pending.count || 0) + (proofUploaded.count || 0) + (completed.count || 0) + (failed.count || 0),
        pending_orders: pending.count || 0,
        proof_uploaded_orders: proofUploaded.count || 0,
        completed_orders: completed.count || 0,
        failed_orders: failed.count || 0,
        total_revenue: totalRevenue,
        recent_activity: recentResult.count || 0,
      };
    }
  );

  const summary = summaryResult as AdminOrderSummary;

  const response: AdminOrdersResponse = {
    orders: enrichedOrders,
    summary,
    pagination: {
      current_page: page,
      total_pages: Math.ceil((count || 0) / limit),
      total_items: count || 0,
      items_per_page: limit,
      has_next: offset + limit < (count || 0),
      has_prev: page > 1
    }
  };

  return formatSuccess(response);
});
