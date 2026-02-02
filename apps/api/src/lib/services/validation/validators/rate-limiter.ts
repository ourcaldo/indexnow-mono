/**
 * Rate Limiter and Business Rule Validator
 * Implements rate limiting and business logic validation
 * 
 * Part of Enhancement #2: Strengthen Input Validation
 */

import { NUMERIC_LIMITS } from '@indexnow/shared';

/**
 * Interface for rate limit storage (In-Memory or Redis)
 */
export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, data: { count: number; resetTime: number }, windowMs: number): Promise<void>;
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getAllEntries(): Promise<[string, { count: number; resetTime: number }][]>;
}

/**
 * Default In-Memory Storage implementation
 */
class InMemoryStore implements RateLimitStore {
  private limits = new Map<string, { count: number; resetTime: number }>();

  async get(key: string) {
    return this.limits.get(key) || null;
  }

  async set(key: string, data: { count: number; resetTime: number }) {
    this.limits.set(key, data);
  }

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const data = this.limits.get(key);
    
    if (!data || data.resetTime <= now) {
      const newData = { count: 1, resetTime: now + windowMs };
      this.limits.set(key, newData);
      return newData;
    }

    data.count++;
    return data;
  }

  async delete(key: string) {
    return this.limits.delete(key);
  }

  async clear() {
    this.limits.clear();
  }

  async getAllEntries() {
    return Array.from(this.limits.entries());
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface BusinessRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  quotaUsage?: {
    current: number;
    limit: number;
    remaining: number;
  };
}

/**
 * Rate Limiter Service
 * Provides comprehensive rate limiting and business rule validation
 * Refactored to support distributed state (Redis-ready)
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private store: RateLimitStore;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(store?: RateLimitStore) {
    this.store = store || new InMemoryStore();
    this.startCleanup();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is within rate limit
   * Uses sliding window approach conceptually by resetting on expiration
   */
  async checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const now = Date.now();

    const limitData = await this.store.increment(key, config.windowMs);

    // Check if limit exceeded
    if (limitData.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limitData.resetTime,
        retryAfter: Math.ceil((limitData.resetTime - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - limitData.count),
      resetTime: limitData.resetTime,
    };
  }

  /**
   * Validate API request rate limits
   */
  async validateApiRateLimit(userId: string, endpoint: string, userPackage?: string): Promise<RateLimitResult> {
    const packageLimits = this.getPackageRateLimits(userPackage);
    const key = `api:${userId}:${endpoint}`;

    return this.checkRateLimit(key, {
      windowMs: packageLimits.windowMs,
      maxRequests: packageLimits.maxRequests,
      keyGenerator: (id) => id
    });
  }

  /**
   * Validate file upload rate limits
   */
  async validateUploadRateLimit(userId: string, fileSize: number): Promise<RateLimitResult> {
    const key = `upload:${userId}`;
    
    return this.checkRateLimit(key, {
      windowMs: 60 * 60 * 1000, // 1 hour window
      maxRequests: 50, // 50 uploads per hour
      keyGenerator: (id) => id
    });
  }

  /**
   * Validate bulk operation rate limits
   */
  async validateBulkOperationLimit(userId: string, operationType: 'urls' | 'keywords' | 'jobs', itemCount: number): Promise<BusinessRuleValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const limits = {
      urls: NUMERIC_LIMITS.BULK_OPERATIONS.max,
      keywords: NUMERIC_LIMITS.BULK_OPERATIONS.max,
      jobs: 10
    };

    if (itemCount > limits[operationType]) {
      errors.push(`Bulk ${operationType} operation exceeds maximum allowed items (${limits[operationType]})`);
    }

    const key = `bulk:${operationType}:${userId}`;
    const rateLimitResult = await this.checkRateLimit(key, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
    });

    if (!rateLimitResult.allowed) {
      errors.push(`Bulk ${operationType} rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate user quota usage
   */
  validateQuotaUsage(
    userId: string,
    resourceType: 'urls' | 'keywords' | 'service_accounts' | 'jobs',
    requestedAmount: number,
    currentUsage: number,
    quotaLimit: number
  ): BusinessRuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const newTotal = currentUsage + requestedAmount;
    const remaining = Math.max(0, quotaLimit - currentUsage);

    if (newTotal > quotaLimit) {
      errors.push(`${resourceType} quota exceeded. Requested: ${requestedAmount}, Available: ${remaining}, Limit: ${quotaLimit}`);
    }

    // Warning when approaching limit (80%)
    if (newTotal > quotaLimit * 0.8 && newTotal <= quotaLimit) {
      warnings.push(`Approaching ${resourceType} quota limit. ${quotaLimit - newTotal} remaining out of ${quotaLimit}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quotaUsage: {
        current: currentUsage,
        limit: quotaLimit,
        remaining
      }
    };
  }

  /**
   * Validate subscription and package rules
   */
  validateSubscriptionRules(
    userId: string,
    userPackage: string,
    action: 'create_job' | 'add_service_account' | 'add_keywords' | 'bulk_upload',
    additionalData?: Record<string, any>
  ): BusinessRuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const packageRules = this.getPackageRules(userPackage);

    switch (action) {
      case 'create_job':
        if (!packageRules.allowScheduledJobs && additionalData?.scheduleType !== 'one-time') {
          errors.push('Scheduled jobs are not available in your current package');
        }
        break;

      case 'add_service_account':
        const currentServiceAccounts = additionalData?.currentCount || 0;
        if (currentServiceAccounts >= packageRules.maxServiceAccounts) {
          errors.push(`Service account limit reached. Your package allows ${packageRules.maxServiceAccounts} service accounts`);
        }
        break;

      case 'add_keywords':
        const keywordCount = additionalData?.count || 1;
        if (keywordCount > packageRules.maxKeywordsPerOperation) {
          errors.push(`Cannot add ${keywordCount} keywords at once. Your package allows maximum ${packageRules.maxKeywordsPerOperation} keywords per operation`);
        }
        break;

      case 'bulk_upload':
        if (!packageRules.allowBulkOperations) {
          errors.push('Bulk operations are not available in your current package');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate trial period restrictions
   */
  validateTrialRestrictions(
    userId: string,
    isTrialUser: boolean,
    trialDaysRemaining: number,
    action: string
  ): BusinessRuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isTrialUser) {
      return { isValid: true, errors, warnings };
    }

    // Trial restrictions
    const trialLimits = {
      maxUrlsPerJob: 10,
      maxKeywords: 5,
      maxServiceAccounts: 1,
      restrictedFeatures: ['scheduled_jobs', 'bulk_operations', 'api_access']
    };

    if (trialLimits.restrictedFeatures.includes(action)) {
      errors.push(`Feature '${action}' is not available during trial period. Upgrade to continue using this feature`);
    }

    // Warning for trial expiration
    if (trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
      warnings.push(`Your trial expires in ${trialDaysRemaining} days. Upgrade to continue using IndexNow Studio`);
    } else if (trialDaysRemaining <= 0) {
      errors.push('Your trial period has expired. Please upgrade your subscription to continue');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get rate limits based on user package
   */
  private getPackageRateLimits(userPackage?: string): { windowMs: number; maxRequests: number } {
    const limits = {
      free: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10/hour
      basic: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50/hour
      professional: { windowMs: 60 * 60 * 1000, maxRequests: 200 }, // 200/hour
      enterprise: { windowMs: 60 * 60 * 1000, maxRequests: 1000 }, // 1000/hour
    };

    return limits[userPackage as keyof typeof limits] || limits.free;
  }

  /**
   * Get business rules based on user package
   */
  private getPackageRules(userPackage: string): {
    allowScheduledJobs: boolean;
    allowBulkOperations: boolean;
    maxServiceAccounts: number;
    maxKeywordsPerOperation: number;
  } {
    const rules = {
      free: {
        allowScheduledJobs: false,
        allowBulkOperations: false,
        maxServiceAccounts: 1,
        maxKeywordsPerOperation: 10
      },
      basic: {
        allowScheduledJobs: true,
        allowBulkOperations: false,
        maxServiceAccounts: 3,
        maxKeywordsPerOperation: 50
      },
      professional: {
        allowScheduledJobs: true,
        allowBulkOperations: true,
        maxServiceAccounts: 10,
        maxKeywordsPerOperation: 200
      },
      enterprise: {
        allowScheduledJobs: true,
        allowBulkOperations: true,
        maxServiceAccounts: 50,
        maxKeywordsPerOperation: 1000
      }
    };

    return rules[userPackage as keyof typeof rules] || rules.free;
  }

  /**
   * Clear rate limit for specific key (admin function)
   */
  async clearRateLimit(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key);
  }

  /**
   * Start cleanup process for expired limits
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();
      const entries = await this.store.getAllEntries();
      for (const [key, data] of entries) {
        if (data.resetTime <= now) {
          await this.store.delete(key);
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  /**
   * Stop cleanup process
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Reset all rate limits (admin function)
   */
  async resetAllLimits(): Promise<void> {
    await this.store.clear();
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();