import { NextRequest, NextResponse } from 'next/server';
import { type AdminUser } from '@indexnow/auth';
import { adminApiWrapper } from '@/lib/core/api-response-middleware';
import { formatSuccess } from '@/lib/core/api-response-formatter';
import { logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger } from '@/lib/monitoring/activity-logger';
import {
  type AdminOrdersResponse,
  type AdminOrderTransaction,
  type AdminOrderSummary
} from '@indexnow/shared';
import {
  SecureServiceRoleWrapper,
  supabaseAdmin,
  type Json
} from '@indexnow/database';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
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

  const { orders, count } = ordersResult as { orders: any[], count: number }; // Casting as 'any' briefly to handle joins which are not in strict Row type

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
  const profileMap = new Map<string, any>();
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
            .in('user_id', allProfileIds);
          return data;
        }
      );
      profiles?.forEach(p => profileMap.set(p.user_id, p));
    } catch (e) {
      logger.error({ error: e }, 'Failed to bulk fetch profiles');
    }
  }

  // 3. Parallel fetch emails
  if (userIds.size > 0) {
    await Promise.all([...userIds].map(async (uid) => {
      try {
        const email = await SecureServiceRoleWrapper.executeSecureOperation(
          { ...ordersContext, operation: 'admin_enrich_orders_email' },
          {
            table: 'auth.users',
            operationType: 'select',
            columns: ['email'],
            whereConditions: { id: uid }
          },
          async () => {
            const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
            return data?.user?.email || null;
          }
        );
        if (email) {
          emailMap.set(uid, email);
        }
      } catch (e) { /* ignore */ }
    }));
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

    // Client-side filtering for customer name/email
    if (customer) {
      const customerLower = customer.toLowerCase();
      const fullName = enrichedOrder.user.full_name.toLowerCase();
      const email = enrichedOrder.user.email.toLowerCase();

      if (fullName.includes(customerLower) || email.includes(customerLower)) {
        enrichedOrders.push(enrichedOrder);
      }
    } else {
      enrichedOrders.push(enrichedOrder);
    }
  }

  // Calculate summary (separate query for performance, or aggregate)
  // For now, simplified summary based on current page or separate count query
  // Real implementation should run a separate aggregation query.

  // Running aggregation query
  const summaryContext = { ...ordersContext, operation: 'admin_get_orders_summary' };
  const summaryResult = await SecureServiceRoleWrapper.executeSecureOperation(
    summaryContext,
    { table: 'indb_payment_transactions', operationType: 'select', columns: ['status', 'amount'] },
    async () => {
      // This might be heavy, in production use materialized view or specific stats table
      const { data, error } = await supabaseAdmin
        .from('indb_payment_transactions')
        .select('status, amount, created_at');
      if (error) throw error;
      return data || [];
    }
  );

  const summaryData = summaryResult as any[];

  const summary: AdminOrderSummary = {
    total_orders: summaryData.length,
    pending_orders: summaryData.filter(t => t.status === 'pending').length,
    proof_uploaded_orders: summaryData.filter(t => t.status === 'proof_uploaded').length,
    completed_orders: summaryData.filter(t => t.status === 'completed').length,
    failed_orders: summaryData.filter(t => t.status === 'failed').length,
    total_revenue: summaryData.filter(t => t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0),
    recent_activity: summaryData.filter(t => {
      const d = new Date(t.created_at);
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() - 7);
      return d >= sevenDays;
    }).length
  };

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
