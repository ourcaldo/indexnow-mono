/**
 * UserProfileService — centralised user profile queries.
 *
 * Every authenticated route that reads `indb_auth_user_profiles` should go
 * through this service instead of duplicating the SecureServiceRoleWrapper
 * boilerplate inline.  The service keeps the audit trail intact by forwarding
 * the caller's `source` string into the wrapper metadata.
 */

import { NextRequest } from 'next/server';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { type Database, getClientIP } from '@indexnow/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

type UserProfileRow = Database['public']['Tables']['indb_auth_user_profiles']['Row'];
type PaymentPackageRow = Database['public']['Tables']['indb_payment_packages']['Row'];

/** Minimal auth context — mirrors the fields routes actually use. */
export interface ProfileServiceAuth {
  userId: string;
  supabase: SupabaseClient<Database>;
}

/** Full profile row joined with the user's payment package. */
export type FullProfileWithPackage = UserProfileRow & {
  package: PaymentPackageRow | null;
};

/** Fields needed for trial-status checks. */
export type TrialStatusProfile = Pick<
  UserProfileRow,
  'is_trial_active' | 'trial_ends_at' | 'package_id' | 'subscription_start_date' | 'subscription_end_date'
>;

/** Fields needed for subscription date checks (trial-eligibility, legacy subscription). */
export type SubscriptionDatesProfile = Pick<
  UserProfileRow,
  'package_id' | 'subscription_start_date' | 'subscription_end_date'
>;

/** Fields needed for billing/packages display. */
export type BillingInfoProfile = Pick<
  UserProfileRow,
  'package_id' | 'subscription_end_date' | 'country'
>;

/** Fields needed for active-subscription gating. */
export type SubscriptionCheckProfile = Pick<UserProfileRow, 'is_active' | 'package_id'>;

/** Fields needed for Paddle customer portal. */
export type PaddleCustomerProfile = Pick<UserProfileRow, 'paddle_customer_id'>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildContext(
  auth: ProfileServiceAuth,
  request: NextRequest,
  operation: string,
  source: string,
  reason: string,
) {
  return {
    userId: auth.userId,
    operation,
    source,
    reason,
    metadata: { service: 'UserProfileService', endpoint: source },
    ipAddress: getClientIP(request) ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  };
}

const PROFILE_TABLE = { table: 'indb_auth_user_profiles' as const, operationType: 'select' as const };

// ── Service ──────────────────────────────────────────────────────────────────

export class UserProfileService {
  /**
   * Full profile with joined payment package (all fields).
   * Used by: profile, billing/overview, dashboard.
   */
  static async getFullProfile(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<FullProfileWithPackage> {
    return SecureServiceRoleWrapper.executeWithUserSession<FullProfileWithPackage>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'get_user_profile', source, 'Fetching user profile with package information'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('*, package:indb_payment_packages(*)')
          .eq('user_id', auth.userId)
          .single();
        if (error) throw error;
        return data as unknown as FullProfileWithPackage;
      },
    );
  }

  /**
   * Trial-specific fields.
   * Used by: trial-status.
   */
  static async getTrialStatus(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<TrialStatusProfile> {
    return SecureServiceRoleWrapper.executeWithUserSession<TrialStatusProfile>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'get_user_trial_status', source, 'Fetching user trial status'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('is_trial_active, trial_ends_at, package_id, subscription_start_date, subscription_end_date')
          .eq('user_id', auth.userId)
          .single();
        if (error) throw error;
        return data;
      },
    );
  }

  /**
   * Subscription date fields.
   * Used by: trial-eligibility, my-subscription.
   */
  static async getSubscriptionDates(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<SubscriptionDatesProfile> {
    return SecureServiceRoleWrapper.executeWithUserSession<SubscriptionDatesProfile>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'get_subscription_dates', source, 'Fetching user subscription dates'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('package_id, subscription_start_date, subscription_end_date')
          .eq('user_id', auth.userId)
          .single();
        if (error) throw error;
        return data;
      },
    );
  }

  /**
   * Billing display fields (package, end date, country).
   * Used by: billing/packages.
   * Returns null if profile not found (PGRST116).
   */
  static async getBillingInfo(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<BillingInfoProfile | null> {
    return SecureServiceRoleWrapper.executeWithUserSession<BillingInfoProfile | null>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'get_billing_info', source, 'Fetching user billing info'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('package_id, subscription_end_date, country')
          .eq('user_id', auth.userId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    );
  }

  /**
   * Paddle customer ID.
   * Used by: customer-portal.
   * Returns null if profile not found.
   */
  static async getPaddleCustomerId(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<PaddleCustomerProfile | null> {
    return SecureServiceRoleWrapper.executeWithUserSession<PaddleCustomerProfile | null>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'get_paddle_customer_id', source, 'Fetching Paddle customer ID'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('paddle_customer_id')
          .eq('user_id', auth.userId)
          .maybeSingle();
        if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
        return data;
      },
    );
  }

  /**
   * Active subscription check (is_active + package_id).
   * Used by: rank-tracking/domains POST.
   */
  static async getSubscriptionCheck(
    auth: ProfileServiceAuth,
    request: NextRequest,
    source: string,
  ): Promise<SubscriptionCheckProfile | null> {
    return SecureServiceRoleWrapper.executeWithUserSession<SubscriptionCheckProfile | null>(
      asTypedClient(auth.supabase),
      buildContext(auth, request, 'check_user_subscription', source, 'Checking user subscription status'),
      PROFILE_TABLE,
      async (db) => {
        const { data, error } = await db
          .from('indb_auth_user_profiles')
          .select('is_active, package_id')
          .eq('user_id', auth.userId)
          .single();
        if (error) throw new Error(`Failed to check subscription: ${error.message}`);
        return data;
      },
    );
  }
}
