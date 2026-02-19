// (#V7 L-23) This form relies on native HTML validation (required attributes)
// and server-side Zod validation in the packages API route. Client-side Zod
// validation would improve UX with inline errors but is not critical.
'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Clock } from 'lucide-react';

interface PricingTier {
  period: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  period_label: string;
  regular_price: number;
  promo_price: number;
  paddle_price_id?: string;
}

interface PaymentPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  quota_limits: {
    concurrent_jobs?: number;
    keywords_limit?: number;
  };
  is_active: boolean;
  is_popular?: boolean;
  sort_order: number;
  pricing_tiers?: PricingTier[];
  created_at: string;
  updated_at: string;
}

interface PackageFormData extends Omit<Partial<PaymentPackage>, 'pricing_tiers'> {
  pricing_tiers?: Record<string, PricingTier>;
}

interface PackageFormProps {
  packageData: Partial<PaymentPackage>;
  onSave: (packageData: Partial<PaymentPackage>) => void;
  onCancel: () => void;
}

export function PackageForm({ packageData, onSave, onCancel }: PackageFormProps) {
  // Transform array to record for easier form handling
  const initialTiers: Record<string, PricingTier> = {};
  if (Array.isArray(packageData.pricing_tiers)) {
    packageData.pricing_tiers.forEach((tier) => {
      initialTiers[tier.period] = tier;
    });
  }

  const [formData, setFormData] = useState<PackageFormData>({
    ...packageData,
    features: packageData.features || [],
    quota_limits: packageData.quota_limits || {},
    pricing_tiers: initialTiers,
  });

  const updateField = <K extends keyof PackageFormData>(field: K, value: PackageFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuotaLimit = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      quota_limits: { ...prev.quota_limits, [key]: value },
    }));
  };

  const updatePricingTierField = (
    period: string,
    field: keyof PricingTier,
    value: string | number
  ) => {
    setFormData((prev) => {
      const currentTiers = prev.pricing_tiers || {};
      const updatedTiers = {
        ...currentTiers,
        [period]: {
          ...(currentTiers[period] || {
            period: period as PricingTier['period'],
            period_label: period,
            regular_price: 0,
            promo_price: 0,
          }),
          [field]: value,
        },
      };

      return {
        ...prev,
        pricing_tiers: updatedTiers as Record<string, PricingTier>,
      };
    });
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), ''],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...(formData.features || [])];
    updatedFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: updatedFeatures }));
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = (formData.features || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, features: updatedFeatures }));
  };

  const handleFormSubmit = () => {
    // Transform record back to array for API
    const finalTiers = formData.pricing_tiers ? Object.values(formData.pricing_tiers) : [];

    onSave({
      ...formData,
      pricing_tiers: finalTiers,
    } as Partial<PaymentPackage>);
  };

  const initializePricingTiers = () => {
    const defaultTiers: Record<string, PricingTier> = {
      monthly: { period: 'monthly', period_label: 'Monthly', regular_price: 0, promo_price: 0 },
      annual: { period: 'annual', period_label: 'Annual', regular_price: 0, promo_price: 0 },
    };
    setFormData((prev) => ({ ...prev, pricing_tiers: defaultTiers }));
  };

  useEffect(() => {
    if (
      formData.slug !== 'free' &&
      (!formData.pricing_tiers || Object.keys(formData.pricing_tiers).length === 0)
    ) {
      initializePricingTiers();
    }
  }, [formData.slug]);

  return (
    <div className="border-border rounded-lg border bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Package Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            placeholder="Premium"
          />
        </div>

        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Slug</label>
          <input
            type="text"
            value={formData.slug || ''}
            onChange={(e) => updateField('slug', e.target.value)}
            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            placeholder="premium"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-foreground mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            placeholder="Enhanced features for professionals"
          />
        </div>

        {/* Currency - USD Only */}
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Currency</label>
          <input
            type="text"
            value="USD"
            readOnly
            disabled
            className="border-border bg-muted text-muted-foreground w-full rounded-lg border px-3 py-2"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            All packages use USD pricing (Paddle handles multi-currency conversion)
          </p>
        </div>

        {/* Sort Order */}
        <div>
          <label className="text-foreground mb-2 block text-sm font-medium">Sort Order</label>
          <input
            type="number"
            value={formData.sort_order || 0}
            onChange={(e) => updateField('sort_order', parseInt(e.target.value))}
            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            placeholder="0"
          />
        </div>

        {/* Quota Limits */}
        <div className="md:col-span-2">
          <h3 className="text-foreground border-border mb-4 border-b pb-2 text-lg font-medium">
            Quota Limits
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Concurrent Jobs
              </label>
              <input
                type="number"
                value={formData.quota_limits?.concurrent_jobs || 0}
                onChange={(e) => updateQuotaLimit('concurrent_jobs', parseInt(e.target.value))}
                className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                <span className="flex items-center gap-2">
                  Keywords Limit
                  <span className="bg-success/10 text-success border-success/20 rounded-full border px-2 py-1 text-xs">
                    Rank Tracker
                  </span>
                </span>
              </label>
              <input
                type="number"
                value={formData.quota_limits?.keywords_limit || 0}
                onChange={(e) => updateQuotaLimit('keywords_limit', parseInt(e.target.value))}
                className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="100 (use -1 for unlimited)"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Maximum number of keywords that can be tracked simultaneously for rank monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers (only for paid packages) */}
        {formData.slug !== 'free' && (
          <div className="md:col-span-2">
            <h3 className="text-foreground border-border mb-4 border-b pb-2 text-lg font-medium">
              Pricing Tiers
            </h3>
            <div className="space-y-6">
              {[
                { period: 'monthly', label: 'Monthly', defaultLabel: 'Monthly' },
                { period: 'annual', label: 'Annual', defaultLabel: 'Annual' },
              ].map((periodInfo) => {
                const tierData = formData.pricing_tiers?.[periodInfo.period] || {
                  period: periodInfo.period as PricingTier['period'],
                  period_label: periodInfo.defaultLabel,
                  regular_price: 0,
                  promo_price: 0,
                };

                return (
                  <div
                    key={periodInfo.period}
                    className="bg-secondary border-border rounded-lg border p-6"
                  >
                    {/* Period Header */}
                    <div className="mb-4">
                      <h4 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                        <Clock className="text-accent h-5 w-5" />
                        {periodInfo.label} Billing
                      </h4>
                    </div>

                    {/* USD Pricing Fields */}
                    <div className="border-border rounded-lg border bg-white p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-foreground mb-2 block text-sm font-medium">
                            Period Label
                          </label>
                          <input
                            type="text"
                            value={tierData.period_label || periodInfo.defaultLabel}
                            onChange={(e) =>
                              updatePricingTierField(
                                periodInfo.period,
                                'period_label',
                                e.target.value
                              )
                            }
                            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                            placeholder={periodInfo.defaultLabel}
                          />
                        </div>
                        <div>
                          <label className="text-foreground mb-2 block text-sm font-medium">
                            Paddle Price ID
                          </label>
                          <input
                            type="text"
                            value={tierData.paddle_price_id || ''}
                            onChange={(e) =>
                              updatePricingTierField(
                                periodInfo.period,
                                'paddle_price_id',
                                e.target.value
                              )
                            }
                            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-transparent focus:ring-2"
                            placeholder="pri_01hxxxx..."
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Get this from Paddle Dashboard → Catalog → Prices
                          </p>
                        </div>
                        <div>
                          <label className="text-foreground mb-2 block text-sm font-medium">
                            Regular Price (USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tierData.regular_price || 0}
                            onChange={(e) =>
                              updatePricingTierField(
                                periodInfo.period,
                                'regular_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                            placeholder="29.99"
                          />
                        </div>
                        <div>
                          <label className="text-foreground mb-2 block text-sm font-medium">
                            Promo Price (USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tierData.promo_price || 0}
                            onChange={(e) =>
                              updatePricingTierField(
                                periodInfo.period,
                                'promo_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                            placeholder="19.99"
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Leave at 0 if no promotional pricing
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground border-border border-b pb-2 text-lg font-medium">
              Features
            </h3>
            <button
              onClick={addFeature}
              className="bg-accent hover:bg-accent/90 flex items-center space-x-2 rounded-lg px-3 py-1 text-sm text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Feature</span>
            </button>
          </div>
          <div className="space-y-2">
            {(formData.features || []).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="border-border focus:ring-accent flex-1 rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="Feature description"
                />
                <button
                  onClick={() => removeFeature(index)}
                  className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active || false}
              onChange={(e) => updateField('is_active', e.target.checked)}
              className="border-border text-accent focus:ring-accent rounded"
            />
            <span className="text-foreground ml-2 text-sm">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_popular || false}
              onChange={(e) => updateField('is_popular', e.target.checked)}
              className="border-border text-accent focus:ring-accent rounded"
            />
            <span className="text-foreground ml-2 text-sm">Popular</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleFormSubmit}
          className="bg-primary hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
