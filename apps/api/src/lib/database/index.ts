import { NextRequest } from 'next/server'
import { createServerClient, supabase, supabaseAdmin, supabaseBrowser, type Database, type Json } from '@indexnow/database'

// Database Operations & Core Services
export { supabase, supabaseAdmin, supabaseBrowser }
export { DatabaseService } from './database'
export type { Database, Json }
export type * from '@indexnow/database'


/**
 * Creates a server-side Supabase client that handles cookies automatically.
 * Primarily used in route handlers and server components.
 */
export function createServerSupabaseClient(request: NextRequest) {
  return createServerClient({
    getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
    set: (name, value, options) => {
      // Note: request.cookies is read-only in route handlers.
    }
  })
}