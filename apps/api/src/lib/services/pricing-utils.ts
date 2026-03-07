/**
 * Shared pricing tier utilities.
 * Centralizes pricing_tiers parsing, price extraction, and paddle_price_id lookup
 * that was duplicated across billing/overview, dashboard, and subscription routes.
 */

import type { PricingTierDetails, PackagePricingTiers } from '@indexnow/shared';

/** Get display price from a tier (promo_price is the real Paddle price). */
export function getDisplayPrice(tier: PricingTierDetails | null | undefined): number {
  if (!tier) return 0;
  return tier.promo_price ?? tier.regular_price ?? 0;
}

/** Safely parse pricing_tiers that may be a JSON string or already an object. */
export function parsePricingTiers(
  raw: PackagePricingTiers | string | null | undefined
): PackagePricingTiers | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as PackagePricingTiers;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
}

/** Get the first available tier (period name + details). */
export function getFirstTier(
  tiers: PackagePricingTiers | null
): { period: string; tier: PricingTierDetails } | null {
  if (!tiers) return null;
  for (const [period, tier] of Object.entries(tiers)) {
    if (tier) return { period, tier };
  }
  return null;
}

/** Find a tier by paddle_price_id. Returns period + tier, or null. */
export function findTierByPriceId(
  tiers: PackagePricingTiers | null | undefined,
  paddlePriceId: string
): { period: string; tier: PricingTierDetails } | null {
  if (!tiers || !paddlePriceId) return null;
  for (const [period, tier] of Object.entries(tiers)) {
    if (tier && tier.paddle_price_id === paddlePriceId) {
      return { period, tier };
    }
  }
  return null;
}

/** Find which package ID contains a specific paddle_price_id. */
export function findPackageIdByPriceId(
  packages: Array<{ id: string; pricing_tiers: unknown }>,
  paddlePriceId: string
): string | null {
  for (const pkg of packages) {
    const tiers = pkg.pricing_tiers;
    if (!tiers || typeof tiers !== 'object') continue;
    const match = findTierByPriceId(tiers as PackagePricingTiers, paddlePriceId);
    if (match) return pkg.id;
  }
  return null;
}
