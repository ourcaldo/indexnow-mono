/**
 * User Management Service for IndexNow Studio
 * Business logic for user profiles, settings, and account management
 */

import { SupabaseService } from '../external/SupabaseService';
import { EmailService } from '../external/EmailService';
import { USER_ROLES, UserRole, DEFAULT_SETTINGS } from '@/lib/core/constants/AppConstants';
import { 
    type UserProfile as UserDbRow, 
    type UserSettings as UserSettingsDbRow, 
    type InsertUserProfile, 
    type InsertUserSettings, 
    type UpdateUserProfile, 
    type UpdateUserSettings 
} from '@indexnow/database';

// Domain Models
export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  role: string;
  isActive: boolean;
  isSuspended: boolean;
  isTrialActive: boolean;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  packageId?: string | null;
  quotaUsage: {
    dailyUrls: number;
    keywords: number;
  };
  quotaLimits: {
    dailyUrls: number;
    keywords: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string | null;
}

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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  role?: UserRole;
  isActive?: boolean;
  isSuspended?: boolean;
  packageId?: string;
}

export interface UserQuota {
  dailyUrls: {
    used: number;
    limit: number;
    percentage: number;
  };
  keywords: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface TrialEligibility {
  isEligible: boolean;
  reason?: string;
  trialDays: number;
}

interface JobSubmission {
    created_at: string;
}

export class UserManagementService {
  private supabaseService: SupabaseService;
  private emailService: EmailService;

  constructor(
    supabaseService: SupabaseService,
    emailService: EmailService
  ) {
    this.supabaseService = supabaseService;
    this.emailService = emailService;
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(request: CreateUserRequest): Promise<UserProfile> {
    const userData: InsertUserProfile = {
      // email: request.email.toLowerCase(), // Email is stored in auth.users, not profile
      full_name: request.fullName,
      phone_number: request.phoneNumber,
      country: request.country,
      role: (request.role || USER_ROLES.USER) as 'user' | 'admin' | 'super_admin',
      is_active: true,
      is_suspended: false,
      is_trial_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error } = await this.supabaseService.insert<UserDbRow>('indb_auth_user_profiles', userData);

    if (error || !profile) {
      throw new Error(`Failed to create user profile: ${error?.message}`);
    }

    // Create default user settings
    await this.createDefaultUserSettings(profile.user_id);

    return this.mapToDomainProfile(profile);
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabaseService.query<UserDbRow>('indb_auth_user_profiles', {
      filters: { user_id: userId },
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Get user profile by email
   * @deprecated This method is broken because indb_auth_user_profiles does not contain email.
   * Use auth.admin.listUsers() to find user by email first.
   */
  /*
  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabaseService.query<UserDbRow>('indb_auth_user_profiles', {
      filters: { email: email.toLowerCase() },
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return this.mapToDomainProfile(data[0]);
  }
  */

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    const updateData: UpdateUserProfile = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.role) updateData.role = updates.role as 'user' | 'admin' | 'super_admin';
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isSuspended !== undefined) updateData.is_suspended = updates.isSuspended;
    if (updates.packageId !== undefined) updateData.package_id = updates.packageId;

    const { data, error } = await this.supabaseService.update<UserDbRow>(
      'indb_auth_user_profiles',
      updateData,
      { user_id: userId }
    );

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to update user profile: ${error?.message}`);
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Update user login information
   */
  async updateLastLogin(userId: string, ipAddress?: string): Promise<void> {
    const updateData: UpdateUserProfile = {
      last_login_at: new Date().toISOString(),
      last_login_ip: ipAddress,
      updated_at: new Date().toISOString(),
    };
    await this.supabaseService.update('indb_auth_user_profiles', updateData, { user_id: userId });
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await this.supabaseService.query<UserSettingsDbRow>('indb_user_settings', {
      filters: { user_id: userId },
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return this.mapToDomainSettings(data[0]);
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    const updateData: UpdateUserSettings = {
      updated_at: new Date().toISOString(),
    };

    if (settings.timeoutDuration !== undefined) updateData.timeout_duration = settings.timeoutDuration;
    if (settings.retryAttempts !== undefined) updateData.retry_attempts = settings.retryAttempts;
    if (settings.emailJobCompletion !== undefined) updateData.email_job_completion = settings.emailJobCompletion;
    if (settings.emailJobFailure !== undefined) updateData.email_job_failure = settings.emailJobFailure;
    if (settings.emailQuotaAlerts !== undefined) updateData.email_quota_alerts = settings.emailQuotaAlerts;
    if (settings.emailDailyReport !== undefined) updateData.email_daily_report = settings.emailDailyReport;
    if (settings.defaultSchedule) updateData.default_schedule = settings.defaultSchedule as 'one-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';

    const { data, error } = await this.supabaseService.update<UserSettingsDbRow>(
      'indb_user_settings',
      updateData,
      { user_id: userId }
    );

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to update user settings: ${error?.message}`);
    }

    return this.mapToDomainSettings(data[0]);
  }

  /**
   * Get user quota usage
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get actual usage counts
    const [urlsCount, keywordsCount] = await Promise.all([
      this.getDailyUrlUsage(userId),
      this.getKeywordUsage(userId),
    ]);

    return {
      dailyUrls: {
        used: urlsCount,
        limit: profile.quotaLimits.dailyUrls,
        percentage: Math.round((urlsCount / profile.quotaLimits.dailyUrls) * 100),
      },
      keywords: {
        used: keywordsCount,
        limit: profile.quotaLimits.keywords,
        percentage: Math.round((keywordsCount / profile.quotaLimits.keywords) * 100),
      },
    };
  }

  /**
   * Check trial eligibility
   */
  async checkTrialEligibility(userId: string): Promise<TrialEligibility> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      return {
        isEligible: false,
        reason: 'User profile not found',
        trialDays: 0,
      };
    }

    // Check if user has already used trial
    if (profile.isTrialActive || profile.trialEndsAt) {
      return {
        isEligible: false,
        reason: 'Trial already used',
        trialDays: 0,
      };
    }

    // Check if user has active subscription
    if (profile.subscriptionEndsAt && profile.subscriptionEndsAt > new Date()) {
      return {
        isEligible: false,
        reason: 'Active subscription found',
        trialDays: 0,
      };
    }

    return {
      isEligible: true,
      trialDays: 14,
    };
  }

  /**
   * Activate trial for user
   */
  async activateTrial(userId: string, trialDays: number = 14): Promise<UserProfile> {
    const eligibility = await this.checkTrialEligibility(userId);
    if (!eligibility.isEligible) {
      throw new Error(`Trial not eligible: ${eligibility.reason}`);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const updateData: UpdateUserProfile = {
      is_trial_active: true,
      trial_ends_at: trialEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.update<UserDbRow>('indb_auth_user_profiles', updateData, { user_id: userId });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to activate trial: ${error?.message}`);
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Cancel trial for user
   */
  async cancelTrial(userId: string): Promise<UserProfile> {
    const updateData: UpdateUserProfile = {
      is_trial_active: false,
      trial_ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.update<UserDbRow>('indb_auth_user_profiles', updateData, { user_id: userId });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to cancel trial: ${error?.message}`);
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Reset user quota
   */
  async resetUserQuota(userId: string): Promise<void> {
    // Reset daily URL usage
    const updateData: UpdateUserProfile = {
      daily_quota_used: 0,
      quota_reset_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.supabaseService.update('indb_auth_user_profiles', updateData, { user_id: userId });
  }

  /**
   * Suspend user account
   */
  async suspendUser(userId: string, reason: string): Promise<UserProfile> {
    const updateData: UpdateUserProfile = {
      is_suspended: true,
      // suspension_reason: reason, 
      // suspended_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.update<UserDbRow>('indb_auth_user_profiles', updateData, { user_id: userId });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to suspend user: ${error?.message}`);
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Unsuspend user account
   */
  async unsuspendUser(userId: string): Promise<UserProfile> {
    const updateData: UpdateUserProfile = {
      is_suspended: false,
      // suspension_reason: null, 
      // suspended_at: null, 
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.update<UserDbRow>('indb_auth_user_profiles', updateData, { user_id: userId });

    if (error || !data || data.length === 0) {
      throw new Error(`Failed to unsuspend user: ${error?.message}`);
    }

    return this.mapToDomainProfile(data[0]);
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    // This should be a soft delete in production
    const updateData: UpdateUserProfile = {
      is_active: false,
      // deleted_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
    };
    await this.supabaseService.update('indb_auth_user_profiles', updateData, { user_id: userId });
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

    await this.supabaseService.insert<UserSettingsDbRow>('indb_user_settings', defaultSettings);
  }

  /**
   * Get daily URL usage
   */
  private async getDailyUrlUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await this.supabaseService.query<JobSubmission>('indb_job_submissions', {
      filters: { user_id: userId },
    });

    if (!data) return 0;

    // Count submissions from today
    return data.filter((submission) => {
      const submissionDate = new Date(submission.created_at).toISOString().split('T')[0];
      return submissionDate === today;
    }).length;
  }

  /**
   * Get keyword usage
   */
  private async getKeywordUsage(userId: string): Promise<number> {
    const { count } = await this.supabaseService.query('indb_rank_keywords', {
      filters: { user_id: userId },
    });

    return count || 0;
  }

  /**
   * Map database profile to domain model
   */
  private mapToDomainProfile(data: UserDbRow): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      // email is not stored in indb_auth_user_profiles, it lives in auth.users
      email: '', 
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      country: data.country,
      role: data.role,
      isActive: data.is_active,
      isSuspended: data.is_suspended,
      isTrialActive: data.is_trial_active,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      subscriptionEndsAt: data.subscription_end_date ? new Date(data.subscription_end_date) : undefined,
      packageId: data.package_id,
      quotaUsage: {
        dailyUrls: data.daily_quota_used || 0,
        keywords: 0, // Not in DB Row
      },
      quotaLimits: {
        dailyUrls: data.daily_quota_limit || 100,
        keywords: 10, // Not in DB Row
      },
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      lastLoginIp: data.last_login_ip,
    };
  }

  /**
   * Map database settings to domain model
   */
  private mapToDomainSettings(data: UserSettingsDbRow): UserSettings {
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export default UserManagementService;
