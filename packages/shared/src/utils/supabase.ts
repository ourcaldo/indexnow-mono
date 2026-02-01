import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared Supabase client factory
 * Creates clients for both client-side and server-side operations
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabase = (config: SupabaseConfig): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token',
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'indexnow-studio'
        }
      }
    });
  }
  return supabaseInstance;
};

export const getSupabaseAdmin = (config: SupabaseConfig): SupabaseClient => {
  if (!supabaseAdminInstance) {
    const key = config.serviceKey || config.anonKey;
    supabaseAdminInstance = createClient(config.url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'indexnow-studio-admin'
        }
      }
    });
  }
  return supabaseAdminInstance;
};
