/**
 * Zod runtime validation schemas for API response payloads.
 *
 * These schemas mirror the TypeScript interfaces from types/api/responses/
 * and provide runtime validation so both frontends can catch API drift early.
 *
 * Design decisions:
 *  - `.passthrough()` on all objects — extra fields are OK, missing ones are caught
 *  - `validateApiResponse()` logs warnings but never throws (non-breaking)
 *  - Schemas validate structural shape (required fields + types), not business rules
 */
import { z, type ZodType } from 'zod';

// ─── Validation Utility ──────────────────────────────────────────────────────

/**
 * Validate API response data against a Zod schema.
 * Logs a warning on failure but always returns the original data (non-breaking).
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: ZodType<T>,
  endpoint: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(
      `[API Response Validation] Schema mismatch for ${endpoint}:`,
      result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    );
    return data as T;
  }
  return result.data;
}

// ─── User-Dashboard: Rank Tracking ──────────────────────────────────────────

export const domainSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    domain_name: z.string(),
    display_name: z.string().nullable(),
  })
  .passthrough();

export const domainListResponseSchema = z
  .object({
    data: z.array(domainSchema),
    pagination: z.unknown(),
  })
  .passthrough();

export const countrySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    iso2_code: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

export const countryListResponseSchema = z.object({ data: z.array(countrySchema) }).passthrough();

export const keywordSchema = z
  .object({
    id: z.string(),
    keyword: z.string(),
    device_type: z.string(),
  })
  .passthrough();

export const keywordsResponseSchema = z
  .object({
    keywords: z.array(keywordSchema),
    total: z.number(),
  })
  .passthrough();

export const keywordUsageSchema = z
  .object({
    used: z.number(),
    limit: z.number(),
    remaining: z.number(),
    is_unlimited: z.boolean(),
  })
  .passthrough();

export const rankHistoryKeywordSchema = z
  .object({
    id: z.string(),
    keyword: z.string(),
    domain: z.string(),
    country: z.string(),
    device: z.string(),
    current_position: z.number().nullable(),
    change: z.number().nullable(),
    history: z.record(z.number()),
  })
  .passthrough();

export const rankHistoryResponseSchema = z
  .object({
    keywords: z.array(rankHistoryKeywordSchema),
    total: z.number(),
    startDate: z.string(),
    endDate: z.string(),
  })
  .passthrough();

export const createDomainResponseSchema = z.object({ data: domainSchema }).passthrough();

export const addKeywordsResponseSchema = z
  .object({
    created: z.number(),
    keywords: z.array(z.unknown()),
    skipped: z.array(z.string()).optional(),
  })
  .passthrough();

// ─── User-Dashboard: Auth / Profile ──────────────────────────────────────────

export const userProfileSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    name: z.string().nullable(),
  })
  .passthrough();

export const profileResponseSchema = z.object({ profile: userProfileSchema }).passthrough();

export const trialEligibilityResponseSchema = z
  .object({
    eligible: z.boolean(),
    message: z.string().optional(),
  })
  .passthrough();

export const userSettingsResponseSchema = z
  .object({
    settings: z
      .object({
        email_job_completion: z.boolean(),
        email_job_failure: z.boolean(),
        email_daily_report: z.boolean(),
        email_quota_alerts: z.boolean(),
      })
      .passthrough(),
  })
  .passthrough();

// ─── User-Dashboard: Dashboard ──────────────────────────────────────────────

const dashboardQuotaSchema = z
  .object({
    keywords: z.object({ used: z.number(), limit: z.number(), is_unlimited: z.boolean(), remaining: z.number() }).passthrough(),
    domains: z.object({ used: z.number(), limit: z.number(), is_unlimited: z.boolean(), remaining: z.number() }).passthrough(),
  })
  .passthrough();

const dashboardProfileInfoSchema = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    is_trial_active: z.boolean(),
  })
  .passthrough();

export const dashboardAggregateResponseSchema = z
  .object({
    user: z
      .object({
        profile: dashboardProfileInfoSchema.nullable(),
        quota: dashboardQuotaSchema,
        trial: z.object({ eligible: z.boolean(), message: z.string() }).passthrough(),
      })
      .passthrough(),
    billing: z
      .object({
        packages: z.array(z.unknown()),
        current_package_id: z.string().nullable(),
        expires_at: z.string().nullable(),
      })
      .passthrough(),
    rankTracking: z
      .object({
        domains: z.array(domainSchema),
        recentKeywords: z.array(keywordSchema),
      })
      .passthrough(),
    notifications: z.array(z.unknown()),
  })
  .passthrough();

const publicSettingsPackageSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

export const publicSettingsResponseSchema = z
  .object({
    packages: z.object({ packages: z.array(publicSettingsPackageSchema) }).passthrough(),
  })
  .passthrough();

// ─── User-Dashboard: Billing ────────────────────────────────────────────────

const billingCurrentSubscriptionSchema = z
  .object({
    package_name: z.string(),
    package_slug: z.string(),
    subscription_status: z.string(),
    subscription_end_date: z.string().nullable(),
  })
  .passthrough();

const billingStatsSchema = z
  .object({
    total_payments: z.number(),
    total_spent: z.number(),
    next_billing_date: z.string().nullable(),
    days_remaining: z.number().nullable(),
  })
  .passthrough();

const billingRecentTransactionSchema = z
  .object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export const billingOverviewResponseSchema = z
  .object({
    currentSubscription: billingCurrentSubscriptionSchema.nullable(),
    billingStats: billingStatsSchema,
    recentTransactions: z.array(billingRecentTransactionSchema),
  })
  .passthrough();

const billingHistoryTransactionSchema = z
  .object({
    id: z.string(),
    order_id: z.string(),
    amount: z.number(),
    currency: z.string(),
    created_at: z.string(),
  })
  .passthrough();

const billingHistorySummarySchema = z
  .object({
    total_transactions: z.number(),
    total_amount_spent: z.number(),
  })
  .passthrough();

const billingHistoryPaginationSchema = z
  .object({
    current_page: z.number(),
    total_pages: z.number(),
    total_items: z.number(),
  })
  .passthrough();

export const billingHistoryResponseSchema = z
  .object({
    transactions: z.array(billingHistoryTransactionSchema),
    summary: billingHistorySummarySchema,
    pagination: billingHistoryPaginationSchema,
  })
  .passthrough();

export const billingPackageSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

const orderPackageInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .passthrough();

export const orderDetailsResponseSchema = z
  .object({
    order_id: z.string(),
    status: z.string(),
    payment_status: z.string(),
    amount: z.number(),
    currency: z.string(),
    created_at: z.string(),
    package: orderPackageInfoSchema.nullable(),
  })
  .passthrough();

export const subscriptionStatusResponseSchema = z
  .object({
    hasSubscription: z.boolean(),
    subscription: z
      .object({
        paddle_subscription_id: z.string(),
        status: z.string(),
        expires_at: z.string(),
        package_id: z.string(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ─── User-Dashboard: Payment Mutations ──────────────────────────────────────

export const cancelSubscriptionResponseSchema = z.object({ action: z.string() }).passthrough();

export const changePlanResponseSchema = z
  .object({
    subscription: z.object({ id: z.string(), status: z.string() }).passthrough(),
    message: z.string(),
  })
  .passthrough();

export const customerPortalResponseSchema = z.object({ portalUrl: z.string() }).passthrough();

// ─── Admin: Dashboard ───────────────────────────────────────────────────────

export const adminDashboardStatsSchema = z
  .object({
    users: z.unknown(),
    errors: z.unknown(),
    transactions: z.unknown(),
    keywords: z.unknown(),
  })
  .passthrough();

export const adminDashboardResponseSchema = z
  .object({ stats: adminDashboardStatsSchema.nullable() })
  .passthrough();

// ─── Admin: Users ───────────────────────────────────────────────────────────

export const adminUserProfileSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    full_name: z.string().nullable(),
    role: z.string(),
    email: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export const adminUsersResponseSchema = z
  .object({
    users: z.array(adminUserProfileSchema),
    pagination: z.object({ total_pages: z.number(), total_items: z.number() }).passthrough(),
  })
  .passthrough();

export const adminUserDetailResponseSchema = z
  .object({ user: adminUserProfileSchema.nullable() })
  .passthrough();

// ─── Admin: Orders ──────────────────────────────────────────────────────────

const adminOrderTransactionSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    transaction_status: z.string(),
    amount: z.number(),
    currency: z.string(),
    created_at: z.string(),
  })
  .passthrough();

const adminOrderSummarySchema = z
  .object({
    total_orders: z.number(),
    pending_orders: z.number(),
    completed_orders: z.number(),
    total_revenue: z.number(),
  })
  .passthrough();

export const adminOrdersResponseSchema = z
  .object({
    orders: z.array(adminOrderTransactionSchema),
    summary: adminOrderSummarySchema,
    pagination: z
      .object({
        current_page: z.number(),
        total_pages: z.number(),
        total_items: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const adminOrderDetailResponseSchema = z
  .object({
    order: adminOrderTransactionSchema,
    transaction_history: z.array(z.unknown()),
    activity_history: z.array(z.unknown()),
  })
  .passthrough();

export const updateOrderStatusResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
  })
  .passthrough();

// ─── Admin: Activity ────────────────────────────────────────────────────────

const enrichedActivityLogSchema = z
  .object({
    id: z.string(),
    event_type: z.string(),
    user_name: z.string(),
    user_email: z.string(),
    success: z.boolean(),
    created_at: z.string(),
  })
  .passthrough();

export const adminActivityResponseSchema = z
  .object({
    logs: z.array(enrichedActivityLogSchema),
    pagination: z
      .object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() })
      .passthrough(),
  })
  .passthrough();

export const adminActivityDetailResponseSchema = z
  .object({
    activity: enrichedActivityLogSchema.extend({ related_activities: z.array(enrichedActivityLogSchema) }).passthrough().nullable(),
  })
  .passthrough();

// ─── Admin: Errors ──────────────────────────────────────────────────────────

const systemErrorLogSchema = z
  .object({
    id: z.string(),
    error_type: z.string(),
    message: z.string(),
    severity: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export const adminErrorDetailResponseSchema = z
  .object({
    error: systemErrorLogSchema,
    relatedErrors: z.array(systemErrorLogSchema),
    sentry: z
      .object({
        eventId: z.string().nullable(),
        configured: z.boolean(),
      })
      .passthrough(),
  })
  .passthrough();

export const adminErrorStatsResponseSchema = z.record(z.unknown());

export const adminErrorListResponseSchema = z
  .object({
    errors: z.array(systemErrorLogSchema),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

// ─── Admin: Site Settings ───────────────────────────────────────────────────

export const adminSiteSettingsResponseSchema = z
  .object({
    settings: z.record(z.unknown()).nullable(),
  })
  .passthrough();

// ─── Admin: Payment Settings ────────────────────────────────────────────────

const paymentGatewaySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

export const adminPaymentGatewaysResponseSchema = z
  .object({
    gateways: z.array(paymentGatewaySchema),
  })
  .passthrough();

// ─── Admin: Packages ────────────────────────────────────────────────────────

const paymentPackageSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    is_active: z.boolean(),
  })
  .passthrough();

export const adminPackagesResponseSchema = z
  .object({
    packages: z.array(paymentPackageSchema),
  })
  .passthrough();

// ─── Admin: User Activity ───────────────────────────────────────────────────

export const adminUserActivityResponseSchema = z
  .object({
    logs: z.array(enrichedActivityLogSchema),
    user: z
      .object({
        user_id: z.string(),
        full_name: z.string().nullable(),
        email: z.string(),
      })
      .passthrough()
      .nullable(),
    pagination: z
      .object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() })
      .passthrough(),
  })
  .passthrough();
