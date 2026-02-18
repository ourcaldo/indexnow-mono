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

/**
 * Query a table that is NOT yet in the generated Database type.
 *
 * Use this instead of scattering `(client as any).from(table)` across the codebase.
 * Centralises the single unavoidable type escape for tables pending schema regeneration.
 *
 * When the Database type is regenerated, search for `untypedFrom` calls and convert
 * them to direct `client.from('table')` calls to regain full type safety.
 *
 * @example
 *   const { data } = await untypedFrom(supabaseAdmin, 'indb_api_keys')
 *     .select('key_value')
 *     .single();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function untypedFrom(client: SupabaseClient<Database>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as SupabaseClient<any>).from(table);
}
