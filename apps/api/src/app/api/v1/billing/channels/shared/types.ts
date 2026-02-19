export interface PaymentChannelRequest {
  package_id: string;
  billing_period: 'monthly' | 'annual' | 'lifetime' | 'one-time';
  customer_info: CustomerInfo;
  user_data?: UserData;
}

export interface CustomerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  description?: string;
}

export interface UserData {
  full_name: string;
  email: string;
  phone_number?: string;
  country: string;
}

export interface PaymentChannelResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  requires_redirect?: boolean;
  redirect_url?: string;
}

export interface GatewayConfiguration {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
  configuration: Record<string, unknown>;
  api_credentials: Record<string, unknown>;
}
