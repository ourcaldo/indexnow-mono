
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database, InsertUserProfile } from '@indexnow/shared'

type FixedDatabase = {
  public: {
    Tables: Pick<Database['public']['Tables'], 'indb_auth_user_profiles'>
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

const supabase: SupabaseClient<FixedDatabase> = createClient<FixedDatabase>('', '')

async function test() {
    const profile: InsertUserProfile = {
        user_id: '123',
    }

    const { data, error } = await supabase
        .from('indb_auth_user_profiles')
        .insert(profile)
        .select()
}
