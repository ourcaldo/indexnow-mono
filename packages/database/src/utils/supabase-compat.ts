import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@indexnow/shared';

/**
 * Cast any structurally compatible Supabase client to the canonical SupabaseClient<Database> type.
 *
 * Required because @supabase/ssr and @supabase/supabase-js may resolve to different
 * SupabaseClient generic instantiations in pnpm's dependency tree, making the types
 * nominally incompatible despite being structurally identical at runtime.
 *
 * This centralizes the unavoidable `as unknown as` cast in one documented location.
 * The parameter is typed as `object` (rather than a structural constraint) because
 * GoTrueClient's class internals prevent assignability to `Record<string, unknown>`.
 */
export function asTypedClient(client: object): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}
