import { createClient } from '@supabase/supabase-js'
import { logger, AppConfig } from '@indexnow/shared'
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

// Create Supabase client with Database type - direct usage avoids SSR wrapper type issues
// NOTE (#20): Uses anon key intentionally — all operations in this service go through RLS.
// For admin/service-role operations, use SecureServiceRoleHelpers from this package.
const supabase = createClient<Database>(
  AppConfig.supabase.url,
  AppConfig.supabase.anonKey
)

// Type aliases for table names - ensures type safety without SDK generic resolution issues
type Tables = Database['public']['Tables']

export class DatabaseService {
  // ============================================================================
  // USER PROFILES & SETTINGS
  // ============================================================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .select('id, user_id, full_name, phone_number, country, role, is_active, is_suspended, is_trial_active, trial_ends_at, subscription_end_date, package_id, daily_quota_used, daily_quota_limit, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error({ error }, 'Error fetching user profile:')
      return null
    }

    return data as UserProfile | null
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile | null> {
    // Create a typed insert object that matches the table's Insert type
    const insertData: Tables['indb_auth_user_profiles']['Insert'] = profile

    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Error creating user profile:')
      return null
    }

    return data as UserProfile | null
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | null> {
    // Create a typed update object that matches the table's Update type
    const updateData: Tables['indb_auth_user_profiles']['Update'] = updates

    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .update(updateData)
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
      .select('id, user_id, timeout_duration, retry_attempts, email_job_completion, email_job_failure, email_quota_alerts, default_schedule, email_daily_report, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error({ error }, 'Error fetching user settings:')
      return null
    }

    return data as UserSettings | null
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings | null> {
    // Create a typed update object that matches the table's Update type
    const updateData: Tables['indb_auth_user_settings']['Update'] = updates

    const { data, error } = await supabase
      .from('indb_auth_user_settings')
      .update(updateData)
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
      .select('id, user_id, type, title, message, is_read, action_url, metadata, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

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
    // Create a typed update object that matches the table's Update type
    const updateData: Tables['indb_notifications_dashboard']['Update'] = { is_read: true }

    const { error } = await supabase
      .from('indb_notifications_dashboard')
      .update(updateData)
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
