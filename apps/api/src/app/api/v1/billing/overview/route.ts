import { NextRequest } from 'next/server';
import { authenticatedApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database, type PackagePricingTiers , getClientIP} from '@indexnow/shared';

// Derived types from Database schema
type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];
type PaymentSubscriptionRow = Database['public']['Tables']['indb_payment_subscriptions']['Row'];
type PaymentTransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row'];

// Profile with package join
type ProfileWithPackage = UserProfileRow & {
    package: PaymentPackageRow | null;
};

// Subscription with package join
type SubscriptionWithPackage = PaymentSubscriptionRow & {
    package: PaymentPackageRow | null;
};

// Transaction with package and gateway joins
type TransactionWithJoins = PaymentTransactionRow & {
    package: Pick<PaymentPackageRow, 'name'> | null;
    gateway: { name: string } | null;
};

// Current subscription response
interface CurrentSubscriptionInfo {
    package_name: string;
    package_slug: string;
    subscription_status: PaymentSubscriptionRow['status'] | 'active' | 'expired';
    subscription_end_date: string | null;
    subscription_start_date: string | null;
    amount_paid: number;
    billing_period: string;
}

// Recent transaction for overview
interface RecentTransactionInfo {
    id: string;
    amount: number;
    currency: string;
    status: PaymentTransactionRow['status'];
    created_at: string;
    package_name: string;
    payment_method: string;
}

/**
 * GET /api/v1/billing/overview
 * Get user billing overview including subscription, stats, and recent transactions
 */
export const GET = authenticatedApiWrapper(async (request, auth) => {
    try {
        // Fetch user profile with package
        const userProfile = await SecureServiceRoleWrapper.executeWithUserSession<ProfileWithPackage>(
            auth.supabase,
            {
                userId: auth.userId,
                operation: 'get_billing_user_profile',
                source: 'billing/overview',
                reason: 'User fetching their billing profile with package information',
                metadata: { endpoint: '/api/v1/billing/overview' },
                ipAddress: getClientIP(request),
                userAgent: request.headers.get('user-agent') ?? undefined
            },
            { table: 'indb_auth_user_profiles', operationType: 'select' },
            async (db) => {
                const { data, error } = await db
                    .from('indb_auth_user_profiles')
                    .select(`
                        *,
                        package:indb_payment_packages(*)
                    `)
                    .eq('user_id', auth.userId)
                    .single();

                if (error) throw error;
                return data as ProfileWithPackage;
            }
        );

        // Fetch active subscription
        let currentSubscription: SubscriptionWithPackage | null = null;
        try {
            currentSubscription = await SecureServiceRoleWrapper.executeWithUserSession<SubscriptionWithPackage | null>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_active_subscription',
                    source: 'billing/overview',
                    reason: 'User fetching their active billing subscription for overview',
                    metadata: { endpoint: '/api/v1/billing/overview' },
                    ipAddress: getClientIP(request),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_payment_subscriptions', operationType: 'select' },
                async (db) => {
                    const { data, error } = await db
                        .from('indb_payment_subscriptions')
                        .select(`
                            *,
                            package:indb_payment_packages(*)
                        `)
                        .eq('user_id', auth.userId)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (error) throw error;
                    return data as SubscriptionWithPackage | null;
                }
            );
        } catch {
            currentSubscription = null;
        }

        // Fetch recent transactions
        let recentTransactions: TransactionWithJoins[] = [];
        try {
            recentTransactions = await SecureServiceRoleWrapper.executeWithUserSession<TransactionWithJoins[]>(
                auth.supabase,
                {
                    userId: auth.userId,
                    operation: 'get_recent_transactions',
                    source: 'billing/overview',
                    reason: 'User fetching their recent billing transactions for overview',
                    metadata: { endpoint: '/api/v1/billing/overview' },
                    ipAddress: getClientIP(request),
                    userAgent: request.headers.get('user-agent') ?? undefined
                },
                { table: 'indb_payment_transactions', operationType: 'select' },
                async (db) => {
                    const { data, error } = await db
                        .from('indb_payment_transactions')
                        .select(`
                            *,
                            package:indb_payment_packages(name),
                            gateway:indb_payment_gateways(name)
                        `)
                        .eq('user_id', auth.userId)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (error) throw error;
                    return (data ?? []) as TransactionWithJoins[];
                }
            );
        } catch {
            recentTransactions = [];
        }

        // Calculate days remaining
        let daysRemaining: number | null = null;
        if (userProfile.subscription_end_date) {
            const endDate = new Date(userProfile.subscription_end_date);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Build subscription data
        let subscriptionData: CurrentSubscriptionInfo | null = null;

        if (currentSubscription) {
            // Active subscription from subscriptions table
            subscriptionData = {
                package_name: currentSubscription.package?.name ?? 'Unknown',
                package_slug: currentSubscription.package?.slug ?? '',
                subscription_status: currentSubscription.status,
                subscription_end_date: currentSubscription.end_date,
                subscription_start_date: currentSubscription.start_date,
                amount_paid: currentSubscription.package?.price ?? 0,
                billing_period: currentSubscription.package?.billing_period ?? 'monthly'
            };
        } else if (userProfile.package_id && userProfile.package) {
            // Fall back to profile package
            const pkg = userProfile.package;
            const now = new Date();
            const endDate = userProfile.subscription_end_date ? new Date(userProfile.subscription_end_date) : null;
            const isExpired = endDate ? endDate < now : true;

            subscriptionData = {
                package_name: pkg.name,
                package_slug: pkg.slug,
                subscription_status: isExpired ? 'expired' : 'active',
                subscription_end_date: userProfile.subscription_end_date,
                subscription_start_date: userProfile.subscription_start_date,
                amount_paid: pkg.price,
                billing_period: pkg.billing_period
            };
        }

        // Count completed transactions for stats
        const completedTransactions = recentTransactions.filter(t => t.status === 'completed');
        const totalSpent = completedTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Transform recent transactions for response
        const transformedTransactions: RecentTransactionInfo[] = recentTransactions.map(t => ({
            id: t.id,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            created_at: t.created_at,
            package_name: t.package?.name ?? 'Unknown',
            payment_method: t.payment_method ?? 'Unknown'
        }));

        return formatSuccess({
            currentSubscription: subscriptionData,
            billingStats: {
                total_payments: completedTransactions.length,
                total_spent: totalSpent,
                next_billing_date: userProfile.subscription_end_date,
                days_remaining: daysRemaining
            },
            recentTransactions: transformedTransactions
        });
    } catch (error) {
        const structuredError = await ErrorHandlingService.createError(
            ErrorType.DATABASE,
            error instanceof Error ? error : new Error(String(error)),
            { severity: ErrorSeverity.HIGH, userId: auth.userId, endpoint: '/api/v1/billing/overview', method: 'GET', statusCode: 500 }
        );
        return formatError(structuredError);
    }
});
