'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, X, Package, Pencil, CheckCircle2, XCircle, Star, Key, ArrowUpDown, ChevronRight, Globe2, CreditCard } from 'lucide-react';
import { useAdminPackages, useSavePackage, useDeletePackage, type PaymentPackage, type PricingTier } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';

/** Safely coerce features to string[]. DB may return a JSON string instead of array. */
function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.map(String); } catch { /* not JSON — treat as single item */ }
    return raw ? [raw] : [];
  }
  return [];
}

const BILLING_PERIODS = ['monthly', 'annual'] as const;

function emptyPackage(): Partial<PaymentPackage> {
  return { name: '', slug: '', description: '', features: [], quota_limits: { max_keywords: 10, max_domains: 1 }, is_active: true, sort_order: 0, pricing_tiers: {} };
}

const inputClass = "w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";
const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5";

/* ─── Stat pill for the header ────────────────────────────── */
function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
      <span className={`text-sm font-semibold tabular-nums ${accent || 'text-gray-900'}`}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

/* ─── Package card for list view ──────────────────────────── */
function PackageCard({ pkg, onEdit, onDelete }: {
  pkg: PaymentPackage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const features = parseFeatures(pkg.features);
  return (
    <div className="rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition-all group relative">
      {/* Popular ribbon */}
      {pkg.is_popular && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full ring-1 ring-amber-200">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Popular
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pkg.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{pkg.name}</h3>
              <span className="text-[11px] text-gray-400 font-mono">{pkg.slug}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mt-2 mb-4 min-h-[2rem]">{pkg.description || 'No description'}</p>

        {/* Pricing from tiers */}
        {pkg.pricing_tiers && Object.keys(pkg.pricing_tiers).length > 0 ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
            {Object.entries(pkg.pricing_tiers as Record<string, { regular_price?: number; promo_price?: number; paddle_price_id?: string }>).map(([period, tier]) => (
              <div key={period} className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900 tabular-nums">${tier.promo_price || tier.regular_price || 0}</span>
                <span className="text-[11px] text-gray-400">/{period}</span>
                {tier.paddle_price_id && <span className="text-[9px] font-mono text-emerald-500 ml-0.5">linked</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-xs text-gray-400 italic">No pricing tiers</span>
          </div>
        )}

        {/* Quota badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700">
            <Key className="w-3 h-3" /> {(pkg.quota_limits?.max_keywords ?? 0) === -1 ? 'Unlimited' : (pkg.quota_limits?.max_keywords ?? 0)} keywords
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-50 text-xs font-medium text-violet-700">
            <Globe2 className="w-3 h-3" /> {(pkg.quota_limits?.max_domains ?? 0) === -1 ? 'Unlimited' : (pkg.quota_limits?.max_domains ?? 0)} domains
          </div>
          {pkg.pricing_tiers && Object.keys(pkg.pricing_tiers).length > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-xs font-medium text-emerald-700">
              <CreditCard className="w-3 h-3" /> {Object.keys(pkg.pricing_tiers).length} price tiers
            </div>
          )}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-xs font-medium text-gray-600">
            <ArrowUpDown className="w-3 h-3" /> #{pkg.sort_order}
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Features</div>
            <ul className="space-y-1">
              {features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{f}</span>
                </li>
              ))}
              {features.length > 4 && (
                <li className="text-[11px] text-gray-400 pl-5">+{features.length - 4} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {pkg.is_active ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs font-medium text-emerald-700">Active</span></>
          ) : (
            <><XCircle className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-medium text-gray-500">Inactive</span></>
          )}
        </div>
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Edit <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── Editor form (full page) ─────────────────────────────── */
function PackageEditor({ initialData, onSave, onCancel, isPending }: {
  initialData: Partial<PaymentPackage>;
  onSave: (data: Partial<PaymentPackage>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState<Partial<PaymentPackage>>(initialData);
  const [featuresText, setFeaturesText] = useState(() => parseFeatures(initialData.features).join('\n'));
  const [tiers, setTiers] = useState<Record<string, PricingTier>>(() => {
    const raw = initialData.pricing_tiers;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, PricingTier>;
    return {};
  });

  const updateTier = (period: string, field: keyof PricingTier, value: string | number) => {
    setTiers(prev => ({
      ...prev,
      [period]: { ...prev[period], [field]: value },
    }));
  };

  const removeTier = (period: string) => {
    setTiers(prev => {
      const next = { ...prev };
      delete next[period];
      return next;
    });
  };

  const addTier = (period: string) => {
    setTiers(prev => ({
      ...prev,
      [period]: { period: period as PricingTier['period'], period_label: period.charAt(0).toUpperCase() + period.slice(1), regular_price: 0, promo_price: 0, paddle_price_id: '' },
    }));
  };

  const availablePeriods = BILLING_PERIODS.filter(p => !tiers[p]);

  const handleSave = () => {
    const data = { ...editing, features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean), pricing_tiers: tiers };
    onSave(data);
  };

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{editing.id ? 'Edit Package' : 'Create Package'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{editing.id ? `Editing "${editing.name || 'Untitled'}"` : 'Set up a new subscription package'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all">
            <Save className="w-4 h-4" /> {isPending ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>

      {/* Form body — flat layout, no boxes */}
      <div className="px-8 py-6 max-w-3xl space-y-6">

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Package Name</label>
            <input type="text" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} placeholder="e.g. Starter, Pro, Enterprise" />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input type="text" value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputClass} placeholder="e.g. starter" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className={inputClass + ' resize-none'} placeholder="Brief package description..." />
        </div>

        <hr className="border-gray-100" />

        {/* Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Max Keywords</label>
            <input type="number" value={editing.quota_limits?.max_keywords ?? 10} onChange={(e) => setEditing({ ...editing, quota_limits: { ...editing.quota_limits, max_keywords: Number(e.target.value) } })} className={inputClass} />
            <p className="text-[11px] text-gray-400 mt-1">-1 = unlimited</p>
          </div>
          <div>
            <label className={labelClass}>Max Domains</label>
            <input type="number" value={editing.quota_limits?.max_domains ?? 1} onChange={(e) => setEditing({ ...editing, quota_limits: { ...editing.quota_limits, max_domains: Number(e.target.value) } })} className={inputClass} />
            <p className="text-[11px] text-gray-400 mt-1">-1 = unlimited</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Pricing Tiers — Paddle integration */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className={labelClass + ' mb-0'}>Pricing Tiers &amp; Paddle Price IDs</label>
              <p className="text-[11px] text-gray-400 mt-0.5">Each billing period maps to a Paddle Price (<code className="text-[10px] bg-gray-100 px-1 rounded">pri_xxx</code>). Create Products &amp; Prices in Paddle Dashboard first.</p>
            </div>
            {availablePeriods.length > 0 && (
              <select onChange={(e) => { if (e.target.value) { addTier(e.target.value); e.target.value = ''; }}} defaultValue="" className="text-xs border border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer bg-white">
                <option value="" disabled>+ Add tier</option>
                {availablePeriods.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            )}
          </div>

          {Object.keys(tiers).length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
              <CreditCard className="w-5 h-5 text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-400">No pricing tiers configured</p>
              <p className="text-[11px] text-gray-300 mt-0.5">Add a tier to link billing periods with Paddle prices</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(tiers).map(([period, tier]) => (
                <div key={period} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{period}</span>
                    <button onClick={() => removeTier(period)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5" title="Remove tier"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase">Regular Price</label>
                      <input type="number" value={tier.regular_price ?? 0} onChange={(e) => updateTier(period, 'regular_price', Number(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase">Promo Price</label>
                      <input type="number" value={tier.promo_price ?? 0} onChange={(e) => updateTier(period, 'promo_price', Number(e.target.value))} className={inputClass} placeholder="0 = no promo" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase">Paddle Price ID</label>
                      <input type="text" value={tier.paddle_price_id ?? ''} onChange={(e) => updateTier(period, 'paddle_price_id', e.target.value)} className={inputClass + ' font-mono'} placeholder="pri_xxxxxxxxxxxx" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Features */}
        <div>
          <label className={labelClass}>Features (one per line)</label>
          <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={6} className={inputClass + ' resize-none font-mono'} placeholder={"Unlimited submissions\nPriority support\nAdvanced analytics"} />
          {featuresText && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {featuresText.split('\n').filter(Boolean).map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> {f.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Settings */}
        <div className="flex items-center gap-8">
          <div>
            <label className={labelClass}>Sort Order</label>
            <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={inputClass + ' w-24'} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer pt-5">
            <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
            <span>Active</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer pt-5">
            <input type="checkbox" checked={!!editing.is_popular} onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4" />
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> Popular</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*       Main page                                            */
/* ═══════════════════════════════════════════════════════════ */

export default function PackagesPage() {
  useAdminPageViewLogger('settings', 'Packages');
  const { data: packages, isLoading } = useAdminPackages();
  const saveMutation = useSavePackage();
  const deleteMutation = useDeletePackage();

  const [editing, setEditing] = useState<Partial<PaymentPackage> | null>(null);

  const startEdit = (pkg: PaymentPackage) => { setEditing({ ...pkg }); };
  const startCreate = () => { setEditing(emptyPackage()); };

  const handleSave = async (data: Partial<PaymentPackage>) => {
    await saveMutation.mutateAsync(data);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(id);
  };

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="bg-white min-h-full">
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-50 rounded animate-pulse mt-2" />
        </div>
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-1 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-4" />
              </div>
              <div className="h-12 bg-gray-50 border-t border-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Editor */
  if (editing) {
    return (
      <PackageEditor
        initialData={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        isPending={saveMutation.isPending}
      />
    );
  }

  /* Stats */
  const allPkgs = packages ?? [];
  const activePkgs = allPkgs.filter((p) => p.is_active);
  const inactivePkgs = allPkgs.filter((p) => !p.is_active);

  /* List */
  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Packages</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatPill label="total" value={allPkgs.length} />
            <StatPill label="active" value={activePkgs.length} accent="text-emerald-600" />
            {inactivePkgs.length > 0 && <StatPill label="inactive" value={inactivePkgs.length} accent="text-gray-400" />}
          </div>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {allPkgs.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No packages yet.</p>
          <button onClick={startCreate} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Create your first package</button>
        </div>
      ) : (
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allPkgs.map((pkg: PaymentPackage) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => startEdit(pkg)}
              onDelete={() => handleDelete(pkg.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
