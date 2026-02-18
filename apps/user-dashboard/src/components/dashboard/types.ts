import { type Json } from '@indexnow/shared';

export interface UserProfile {
  full_name: string | null;
  email: string;
  package?: {
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    billing_period: string;
    quota_limits: {
      concurrent_jobs: number;
      keywords_limit: number;
    };
  };
  expires_at?: string;
  active_jobs_count?: number;
  keywords_used?: number;
  keywords_limit?: number;
}

export interface KeywordData {
  id: string;
  keyword: string;
  current_position: number | null;
  position_1d: number | null;
  position_3d: number | null;
  position_7d: number | null;
  domain: {
    id?: string;
    display_name: string;
    domain_name: string;
  };
  device_type: string;
  country: {
    name: string;
    iso2_code: string;
  };
  recent_ranking?: {
    position: number | null;
  };
  tags?: string[];
}

export interface PaymentPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  quota_limits: {
    rank_tracking_limit: number;
    concurrent_jobs_limit: number;
  };
  is_popular: boolean;
  is_current: boolean;
  pricing_tiers: Record<string, Json>;
  free_trial_enabled?: boolean;
}
