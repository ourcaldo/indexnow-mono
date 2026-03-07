/**
 * Shared quota calculation logic.
 * Eliminates duplication between quota/route.ts and dashboard/route.ts.
 */

export interface ResourceQuota {
  used: number;
  limit: number;
  remaining: number;
  is_unlimited: boolean;
}

export interface QuotaResult {
  keywords: ResourceQuota;
  domains: ResourceQuota;
}

/** Calculate quota status for a single resource. A limit of -1 means unlimited. */
function calculateResourceQuota(used: number, limit: number): ResourceQuota {
  const isUnlimited = limit === -1;
  return {
    used,
    limit,
    remaining: isUnlimited ? -1 : Math.max(0, limit - used),
    is_unlimited: isUnlimited,
  };
}

/**
 * Validate that a package has properly configured quota_limits.
 * Throws if the package exists but quota_limits is missing or incomplete.
 * Users without a package (free-tier) get 0 quota — no error.
 */
export function validateQuotaLimits(
  quotaLimits: Record<string, number> | null,
  hasPackage: boolean
): void {
  if (
    hasPackage &&
    (!quotaLimits ||
      quotaLimits.max_keywords == null ||
      quotaLimits.max_domains == null)
  ) {
    throw new Error('User package is missing quota_limits configuration');
  }
}

/** Calculate full quota status for keywords and domains. */
export function calculateQuota(
  quotaLimits: Record<string, number> | null,
  keywordsUsed: number,
  domainsUsed: number
): QuotaResult {
  return {
    keywords: calculateResourceQuota(keywordsUsed, quotaLimits?.max_keywords ?? 0),
    domains: calculateResourceQuota(domainsUsed, quotaLimits?.max_domains ?? 0),
  };
}
