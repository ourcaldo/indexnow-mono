import { Json, SystemErrorLog } from '../../database';
import { PaginationMeta as PaginationResponse } from '../../common/CommonTypes';
import { ApiResponse } from '../../common/ResponseTypes';

export interface EnrichedActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  event_type: string; // Mapped from action
  action_description: string | null; // Mapped from description
  target_type?: string | null; // Mapped from metadata
  target_id?: string | null; // Mapped from metadata
  ip_address?: string | null;
  user_agent?: string | null;
  success: boolean; // Mapped from metadata.success
  error_message?: string; // Mapped from metadata.errorMessage
  metadata?: Json;
  created_at: string;
}

export interface GetActivityLogsResponse {
  logs: EnrichedActivityLog[];
  pagination: PaginationResponse;
}

export interface ActivityDetail extends EnrichedActivityLog {
  related_activities: EnrichedActivityLog[];
}

export interface GetActivityDetailResponse {
  activity: ActivityDetail;
}

export interface EnrichedSystemErrorLog extends SystemErrorLog {
  // Add any extra fields if needed, currently UI uses separate userInfo object
}

export interface ErrorDetailResponse {
  error: EnrichedSystemErrorLog;
  userInfo?: {
    email: string;
    full_name?: string;
  };
  relatedErrors: SystemErrorLog[];
}

export interface VerifyRoleResponse extends ApiResponse<{
  isSuperAdmin: boolean;
  isAdmin: boolean;
  role: string;
}> {}

export interface AdminUserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  email_notifications: boolean;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  daily_quota_limit?: number;
  daily_quota_used?: number;
  daily_quota_reset_date?: string;
  subscription_ends_at?: string;
  subscribed_at?: string | null;
  expires_at?: string | null;
  country?: string;
  package: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pricing_tiers: Json;
    currency: string;
    billing_period: string;
    features: Json;
    subscribed_at?: string | null;
    expires_at?: string | null;
  } | null;
}

export interface AdminOrderTransaction {
  id: string;
  user_id: string;
  package_id: string;
  gateway_id: string;
  transaction_type: string;
  transaction_status: string; // 'pending' | 'proof_uploaded' | 'completed' | 'failed'
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  gateway_transaction_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  processed_at: string | null;
  notes: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
  package: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pricing_tiers: Json;
    currency: string;
    billing_period: string;
    features: Json;
  } | null;
  gateway: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user: {
    user_id: string;
    full_name: string;
    role: string;
    email: string;
    created_at: string;
    package_id?: string | null;
    subscribed_at?: string | null;
    expires_at?: string | null;
    phone_number?: string | null;
  };
  verifier?: {
    user_id: string;
    full_name: string;
    role: string;
  } | null;
}

export interface AdminTransactionHistory {
  id: string;
  transaction_id: string;
  old_status: string | null;
  new_status: string;
  action_type: string;
  action_description: string;
  changed_by: string | null;
  changed_by_type: string;
  old_values: Json | null;
  new_values: Json | null;
  notes: string | null;
  metadata: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export interface AdminOrderActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  action_description: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json | null;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export interface AdminOrderDetailResponse {
  order: AdminOrderTransaction;
  transaction_history: AdminTransactionHistory[];
  activity_history: AdminOrderActivityLog[];
}

export interface AdminOrderSummary {
  total_orders: number;
  pending_orders: number;
  proof_uploaded_orders: number;
  completed_orders: number;
  failed_orders: number;
  total_revenue: number;
  recent_activity: number;
}

export interface AdminOrdersResponse {
  orders: AdminOrderTransaction[];
  summary: AdminOrderSummary;
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
