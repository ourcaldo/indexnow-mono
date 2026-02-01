import { supabase, supabaseAdmin, type Database } from '@indexnow/database'

// Type aliases for convenience
type UserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Row']
type InsertUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Insert']
type UpdateUserProfile = Database['public']['Tables']['indb_auth_user_profiles']['Update']
type UserSettings = Database['public']['Tables']['indb_auth_user_settings']['Row']
type UpdateUserSettings = Database['public']['Tables']['indb_auth_user_settings']['Update']
type DashboardNotification = Database['public']['Tables']['indb_notifications_dashboard']['Row']


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
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return data
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return data
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    return data
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user settings:', error)
      return null
    }

    return data
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
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('indb_notifications_dashboard')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }
}

// Singleton instance
export const db = new DatabaseService()

// Export supabaseAdmin for API routes
export { supabaseAdmin }