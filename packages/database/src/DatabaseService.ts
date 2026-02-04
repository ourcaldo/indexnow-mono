import { supabaseBrowser, logger } from '@indexnow/shared'
import { type SupabaseClient } from '@supabase/supabase-js'
import { 
    type Database,
    type DbUserProfile as UserProfile,
    type InsertUserProfile,
    type UpdateUserProfile,
    type DbUserSettings as UserSettings,
    type UpdateUserSettings,
    type DbDashboardNotification as DashboardNotification,
    type UpdateDashboardNotification
} from '@indexnow/shared'

// Using 'any' for the schema type here because standard SupabaseClient<Database> inference
// is failing with 'never' types for insert/update operations due to complex Database type definition.
// We strictly type the inputs and outputs of the service methods to ensure type safety.
const supabase = supabaseBrowser as unknown as SupabaseClient<any, "public", any>

export class DatabaseService {
  // ============================================================================
  // USER PROFILES & SETTINGS
  // ============================================================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error({ error }, 'Error fetching user profile:')
      return null
    }

    return data as UserProfile | null
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Error creating user profile:')
      return null
    }

    return data as UserProfile | null
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Error updating user profile:')
      return null
    }

    return data as UserProfile | null
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error({ error }, 'Error fetching user settings:')
      return null
    }

    return data as UserSettings | null
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Error updating user settings:')
      return null
    }

    return data as UserSettings | null
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<DashboardNotification[]> {
    let query = supabase
      .from('indb_notifications_dashboard')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      logger.error({ error }, 'Error fetching notifications:')
      return []
    }

    return (data as DashboardNotification[]) || []
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('indb_notifications_dashboard')
      .update({ is_read: true } as UpdateDashboardNotification)
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      logger.error({ error }, 'Error marking notification as read:')
      return false
    }

    return true
  }
}

// Singleton instance
export const db = new DatabaseService()
