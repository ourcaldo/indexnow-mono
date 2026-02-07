import { type Json } from '../types/common/Json';

// Base type for track event properties - allows any JSON value or undefined
export interface TrackEventProperties {
  [key: string]: Json | undefined;
}

// User traits with known common fields
export interface UserTraits {
  email?: string | null;
  username?: string | null;
  name?: string | null;
  plan?: string | null;
  [key: string]: Json | undefined;
}

export type AnalyticsTraits = UserTraits;

// Page properties with known common fields
export interface PageProperties {
  url?: string | null;
  path?: string | null;
  title?: string | null;
  referrer?: string | null;
  [key: string]: Json | undefined;
}

export interface AnalyticsClient {
  track: (event: string, properties?: TrackEventProperties) => void;
  page: (properties?: PageProperties) => void;
  identify: (userId: string, traits?: UserTraits) => void;
  reset: () => void;
}

export type Subdomain = 'www' | 'dashboard' | 'backend' | 'api' | 'server';

export interface AnalyticsConfig {
  ga4: {
    enabled: boolean;
    measurementId?: string;
  };
  gtm: {
    enabled: boolean;
    containerId?: string;
  };
  customerio: {
    enabled: boolean;
    siteId?: string;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    traceSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  posthog: {
    enabled: boolean;
    apiKey?: string;
    apiHost: string;
  };
  debug: boolean;
}
