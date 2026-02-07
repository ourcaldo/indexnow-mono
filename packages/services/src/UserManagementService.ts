import { db, supabaseAdmin } from '@indexnow/database';
import {
  USER_ROLES,
  DEFAULT_SETTINGS,
  type TrialEligibility,
  type DbUserProfile,
  type DbUserSettings,
  type InsertUserProfile,
  type UpdateUserProfile,
  type InsertUserSettings,
  type UpdateUserSettings
} from '@indexnow/shared';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserSettings {
  id: string;
  userId: string;
  timeoutDuration: number;
  retryAttempts: number;
  emailJobCompletion: boolean;
  emailJobFailure: boolean;
  emailQuotaAlerts: boolean;
  emailDailyReport: boolean;
  defaultSchedule: string;
  theme: string;
  notifications: {
    email: {
      jobCompletion: boolean;
      jobFailure: boolean;
      quotaAlerts: boolean;
      dailyReport: boolean;
      weeklyReport: boolean;
      securityAlerts: boolean;
    };
    browser: {
      enabled: boolean;
      jobUpdates: boolean;
      systemAlerts: boolean;
    };
    sms: {
      enabled: boolean;
      criticalAlerts: boolean;
    };
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    allowAnalytics: boolean;
    dataRetention: string;
  };
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod: string;
    sessionTimeout: number;
    apiKeyExpiry: number;
    passwordChangeRequired: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQuota {
  dailyUrls: { used: number; limit: number; percentage: number; remaining: number; };
  keywords: { used: number; limit: number; percentage: number; remaining: number; };
  serviceAccounts: { used: number; limit: number; percentage: number; remaining: number; };
  rankChecks: { used: number; limit: number; percentage: number; remaining: number; };
  apiCalls: { used: number; limit: number; percentage: number; remaining: number; };
  storage: { used: number; limit: number; percentage: number; remaining: number; };
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  role?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  role?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  packageId?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  role: UserRole;
  isActive: boolean;
  isSuspended: boolean;
  isTrialActive: boolean;
  trialEndsAt?: Date;
  subscriptionStatus: string;
  subscriptionEndsAt?: Date;
  packageId?: string;
  quotaUsage: {
    dailyUrls: number;
    keywords: number;
    serviceAccounts: number;
    rankChecks: number;
    apiCalls: number;
    storage: number;
  };
  quotaLimits: {
    dailyUrls: number;
    keywords: number;
    serviceAccounts: number;
    rankChecks: number;
    apiCalls: number;
    storage: number;
    concurrentJobs: number;
    historicalData: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class UserManagementService {
  private emailService: IEmailService;

  constructor(emailService: IEmailService) {
    this.emailService = emailService;
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(request: CreateUserRequest): Promise<UserProfile> {
    const userData: InsertUserProfile = {
      user_id: request.email.toLowerCase(), // This should be the auth user ID, but following existing logic
      full_name: request.fullName,
      phone_number: request.phoneNumber,
      country: request.country,
      role: (request.role as 'user' | 'admin' | 'super_admin') || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const profile = await db.createUserProfile(userData);

    if (!profile) {
      throw new Error('Failed to create user profile');
    }

    // Create default user settings
    await this.createDefaultUserSettings(profile.user_id);

    return this.mapDatabaseProfileToModel(profile);
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await db.getUserProfile(userId);
    if (!profile) {
      return null;
    }
    return this.mapDatabaseProfileToModel(profile);
  }

  /**
   * Get user profile by email
   */
  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('indb_auth_user_profiles')
      .select('id, user_id, full_name, phone_number, country, role, is_active, is_suspended, is_trial_active, trial_ends_at, subscription_end_date, package_id, daily_quota_used, daily_quota_limit, created_at, updated_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    // Map to UserProfile - db.getUserProfile might already do this but we need by email
    return this.mapDatabaseProfileToModel(data);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    const updateData: UpdateUserProfile = {};

    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.role) updateData.role = updates.role as 'user' | 'admin' | 'super_admin';
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isSuspended !== undefined) updateData.is_suspended = updates.isSuspended;
    if (updates.packageId !== undefined) updateData.package_id = updates.packageId;

    const updatedProfile = await db.updateUserProfile(userId, updateData);

    if (!updatedProfile) {
      throw new Error('Failed to update user profile');
    }

    return this.mapDatabaseProfileToModel(updatedProfile);
  }

  /**
   * Update user login information
   */
  async updateLastLogin(userId: string, ipAddress?: string): Promise<void> {
    await supabase
      .from('indb_auth_user_profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Note: indb_auth_user_profiles doesn't have last_login_at in the schema I saw
    // but we can add it or log it elsewhere. Functional parity with original:
    // Original had last_login_at and last_login_ip.
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const settings = await db.getUserSettings(userId);
    if (!settings) return null;
    return this.mapDatabaseSettingsToModel(settings);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const updateData: UpdateUserSettings = {};

    if (settings.timeoutDuration !== undefined) updateData.timeout_duration = settings.timeoutDuration;
    if (settings.retryAttempts !== undefined) updateData.retry_attempts = settings.retryAttempts;
    if (settings.emailJobCompletion !== undefined) updateData.email_job_completion = settings.emailJobCompletion;
    if (settings.emailJobFailure !== undefined) updateData.email_job_failure = settings.emailJobFailure;
    if (settings.emailQuotaAlerts !== undefined) updateData.email_quota_alerts = settings.emailQuotaAlerts;
    if (settings.emailDailyReport !== undefined) updateData.email_daily_report = settings.emailDailyReport;
    if (settings.defaultSchedule !== undefined) {
      updateData.default_schedule = settings.defaultSchedule as 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    }

    const updatedSettings = await db.updateUserSettings(userId, updateData);

    if (!updatedSettings) {
      throw new Error('Failed to update user settings');
    }

    return this.mapDatabaseSettingsToModel(updatedSettings);
  }

  private async getPackageConfig(packageId: string | null): Promise<any> {
    if (!packageId) return null;

    const { data } = await supabaseAdmin
      .from('indb_payment_packages')
      .select('settings')
      .eq('id', packageId)
      .single();

    return data?.settings || null;
  }

  /**
   * Get user quota for specific feature
   */
  async getUserQuota(userId: string, feature: string): Promise<number> {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const packageConfig = await this.getPackageConfig(profile.packageId || null);

    // Default fallback values if DB config is missing
    const defaults: Record<string, number> = {
      'domains': 10,
      'keywords': 100,
      'pages': 1000,
      'storage_mb': 100
    };

    // Prioritize DB config -> then defaults
    return packageConfig?.quotas?.[feature] ?? defaults[feature] ?? 0;
  }

  /**
   * Check trial eligibility
   */
  async checkTrialEligibility(userId: string): Promise<TrialEligibility> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      return {
        isEligible: false,
        restrictions: ['User profile not found'],
        trialLength: 0,
        hasUsedTrial: false,
      };
    }

    // Check if user has already used trial
    if (profile.isTrialActive || profile.trialEndsAt) {
      return {
        isEligible: false,
        restrictions: ['Trial already used'],
        trialLength: 0,
        hasUsedTrial: true,
      };
    }

    // Check if user has active subscription
    if (profile.subscriptionEndsAt && profile.subscriptionEndsAt > new Date()) {
      return {
        isEligible: false,
        restrictions: ['Active subscription found'],
        trialLength: 0,
        hasUsedTrial: false,
      };
    }

    return {
      isEligible: true,
      trialLength: 14,
      hasUsedTrial: false,
    };
  }

  /**
   * Activate trial for user
   */
  async activateTrial(userId: string, trialDays: number = 14): Promise<UserProfile> {
    const eligibility = await this.checkTrialEligibility(userId);
    if (!eligibility.isEligible) {
      throw new Error(`Trial not eligible: ${eligibility.restrictions?.join(', ')}`);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const updatedProfile = await db.updateUserProfile(userId, {
      is_trial_active: true,
      trial_ends_at: trialEndsAt.toISOString(),
    });

    if (!updatedProfile) {
      throw new Error('Failed to activate trial');
    }

    return this.mapDatabaseProfileToModel(updatedProfile);
  }

  /**
   * Cancel trial for user
   */
  async cancelTrial(userId: string): Promise<UserProfile> {
    const updatedProfile = await db.updateUserProfile(userId, {
      is_trial_active: false,
      trial_ends_at: new Date().toISOString(),
    });

    if (!updatedProfile) {
      throw new Error('Failed to cancel trial');
    }

    return this.mapDatabaseProfileToModel(updatedProfile);
  }

  /**
   * Reset user quota
   */
  async resetUserQuota(userId: string): Promise<void> {
    await db.updateUserProfile(userId, {
      daily_quota_used: 0,
      quota_reset_date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Suspend user account
   */
  async suspendUser(userId: string, reason: string): Promise<UserProfile> {
    const updatedProfile = await db.updateUserProfile(userId, {
      is_suspended: true,
      suspension_reason: reason,
      suspended_at: new Date().toISOString(),
    });

    if (!updatedProfile) {
      throw new Error('Failed to suspend user');
    }

    return this.mapDatabaseProfileToModel(updatedProfile);
  }

  /**
   * Unsuspend user account
   */
  async unsuspendUser(userId: string): Promise<UserProfile> {
    const updatedProfile = await db.updateUserProfile(userId, {
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
    });

    if (!updatedProfile) {
      throw new Error('Failed to unsuspend user');
    }

    return this.mapDatabaseProfileToModel(updatedProfile);
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    // This should be a soft delete in production
    await db.updateUserProfile(userId, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Create default user settings
   */
  private async createDefaultUserSettings(userId: string): Promise<void> {
    const defaultSettings: InsertUserSettings = {
      user_id: userId,
      timeout_duration: DEFAULT_SETTINGS.USER.TIMEOUT_DURATION,
      retry_attempts: DEFAULT_SETTINGS.USER.RETRY_ATTEMPTS,
      email_job_completion: DEFAULT_SETTINGS.USER.EMAIL_JOB_COMPLETION,
      email_job_failure: DEFAULT_SETTINGS.USER.EMAIL_JOB_FAILURE,
      email_quota_alerts: DEFAULT_SETTINGS.USER.EMAIL_QUOTA_ALERTS,
      email_daily_report: DEFAULT_SETTINGS.USER.EMAIL_DAILY_REPORT,
      default_schedule: DEFAULT_SETTINGS.USER.DEFAULT_SCHEDULE as 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('indb_auth_user_settings')
      .insert(defaultSettings);

    if (error) {
      console.error('Failed to create default user settings:', error);
    }
  }

  /**
   * Get daily URL usage
   */
  private async getDailyUrlUsage(userId: string): Promise<number> {
    // This should query a jobs table, but for now we'll return the used quota from profile
    const profile = await db.getUserProfile(userId);
    return profile?.daily_quota_used || 0;
  }

  /**
   * Get keyword usage
   */
  private async getKeywordUsage(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('indb_rank_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return 0;
    return count || 0;
  }

  /**
   * Get user email from auth.users
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !data.user) {
        if (error) console.error('Error fetching user email:', error);
        // Return null instead of empty string to indicate failure
        return null;
      }

      return data.user.email || null;
    } catch (err) {
      console.error('Error fetching user email:', err);
      return null;
    }
  }

  /**
   * Map database profile to model
   */
  private mapDatabaseProfileToModel(data: DbUserProfile, email?: string, quotas?: Record<string, number>): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      email: email || '', // Email should be provided from auth.users
      fullName: data.full_name || '',
      phoneNumber: data.phone_number || undefined,
      country: data.country || undefined,
      role: data.role as UserRole,
      isActive: data.is_active ?? true,
      isSuspended: data.is_suspended ?? false,
      isTrialActive: data.is_trial_active ?? false,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      subscriptionStatus: 'active', // Default
      subscriptionEndsAt: data.subscription_end_date ? new Date(data.subscription_end_date) : undefined,
      packageId: data.package_id || undefined,
      quotaUsage: {
        dailyUrls: data.daily_quota_used || 0,
        keywords: 0, // Should be fetched separately or cached
        serviceAccounts: 0,
        rankChecks: 0,
        apiCalls: 0,
        storage: 0,
      },
      quotaLimits: {
        dailyUrls: data.daily_quota_limit || quotas?.['pages'] || 100,
        keywords: quotas?.['keywords'] || 10,
        serviceAccounts: quotas?.['service_accounts'] || 5,
        rankChecks: quotas?.['rank_checks'] || 100,
        apiCalls: quotas?.['api_calls'] || 1000,
        storage: quotas?.['storage_mb'] ? quotas['storage_mb'] * 1024 * 1024 : 1024 * 1024 * 100,
        concurrentJobs: quotas?.['concurrent_jobs'] || 1,
        historicalData: quotas?.['historical_days'] || 30,
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map database settings to model
   */
  private mapDatabaseSettingsToModel(data: DbUserSettings): UserSettings {
    return {
      id: data.id,
      userId: data.user_id,
      timeoutDuration: data.timeout_duration,
      retryAttempts: data.retry_attempts,
      emailJobCompletion: data.email_job_completion,
      emailJobFailure: data.email_job_failure,
      emailQuotaAlerts: data.email_quota_alerts,
      emailDailyReport: data.email_daily_report,
      defaultSchedule: data.default_schedule,
      theme: 'auto', // Default
      notifications: {
        email: {
          jobCompletion: data.email_job_completion,
          jobFailure: data.email_job_failure,
          quotaAlerts: data.email_quota_alerts,
          dailyReport: data.email_daily_report,
          weeklyReport: false,
          securityAlerts: true,
        },
        browser: {
          enabled: true,
          jobUpdates: true,
          systemAlerts: true,
        },
        sms: {
          enabled: false,
          criticalAlerts: false,
        },
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        allowAnalytics: true,
        dataRetention: 'standard',
      },
      security: {
        twoFactorEnabled: false,
        twoFactorMethod: 'app',
        sessionTimeout: data.timeout_duration,
        apiKeyExpiry: 30,
        passwordChangeRequired: false,
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export default UserManagementService;