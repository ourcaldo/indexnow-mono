import { NextRequest, NextResponse } from 'next/server';
import { 
  adminApiWrapper, 
  formatSuccess, 
  formatError, 
  createStandardError,
  ErrorType,
  ErrorSeverity,
  logger,
  ActivityLogger,
  type AdminOrdersResponse,
  type AdminOrderTransaction,
  type AdminOrderSummary
} from '@indexnow/shared';
import { 
  SecureServiceRoleWrapper, 
  SecureServiceRoleHelpers, 
  supabaseAdmin,
  type TransactionRow
} from '@indexnow/database';

export const GET = adminApiWrapper(async (request: NextRequest, adminUser) => {
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
    logger.error('Failed to log admin order activity', { error: logError });
  }

  const offset = (page - 1) * limit;

  // Get orders using secure wrapper
  const ordersContext = {
    userId: adminUser.id,
    operation: 'admin_get_orders_list',
    reason: 'Admin fetching orders list with filters and pagination',
    source: 'admin/orders',
    metadata: {
      filters: { status, customer, packageId, dateFrom, dateTo, amountMin, amountMax },
      pagination: { page, limit }
    }
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
          package:indb_payment_packages(
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
          gateway:indb_payment_gateways(
            id,
            name,
            slug
          )
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status); // Changed from transaction_status to status
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

  // Fetch user profiles and auth data
  const enrichedOrders: AdminOrderTransaction[] = [];
  
  for (const order of orders) {
    let userProfile = null;
    let authUser = null;
    let verifierProfile = null;

    if (order.user_id) {
        // Get user profile
        try {
            const profiles = await SecureServiceRoleHelpers.secureSelect(
                { ...ordersContext, operation: 'admin_get_order_user_profile' },
                'indb_auth_user_profiles',
                ['full_name', 'role', 'created_at'],
                { user_id: order.user_id }
            );
            userProfile = profiles.length > 0 ? profiles[0] : null;
        } catch (e) { /* ignore */ }

        // Get user email
        try {
            const { data } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
            if (data?.user) authUser = data;
        } catch (e) { /* ignore */ }
    }

    if (order.verified_by) {
        try {
            const verifiers = await SecureServiceRoleHelpers.secureSelect(
                { ...ordersContext, operation: 'admin_get_order_verifier' },
                'indb_auth_user_profiles',
                ['full_name', 'role', 'user_id'],
                { user_id: order.verified_by }
            );
            verifierProfile = verifiers.length > 0 ? verifiers[0] : null;
        } catch (e) { /* ignore */ }
    }

    const enrichedOrder: AdminOrderTransaction = {
        ...order,
        transaction_status: order.status, // Map status to transaction_status
        transaction_type: order.transaction_type || 'payment', // Default if missing
        gateway_transaction_id: order.external_transaction_id || order.gateway_transaction_id, // Map external id
        user: {
            user_id: order.user_id,
            full_name: userProfile?.full_name || 'Unknown User',
            role: userProfile?.role || 'user',
            email: authUser?.user?.email || 'N/A',
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

    // Client-side filtering for customer name/email (since we can't easily join auth.users in Supabase query)
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
