'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import {
  useAdminPackages,
  useSavePackage,
  useDeletePackage,
  type PaymentPackage,
  type PricingTier,
} from '@/hooks';

function emptyPackage(): Partial<PaymentPackage> {
  return {
    name: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly',
    features: [],
    quota_limits: { concurrent_jobs: 1, keywords_limit: 10 },
    is_active: true,
    sort_order: 0,
    pricing_tiers: [],
  };
}

export default function PackagesPage() {
  const { data: packages, isLoading } = useAdminPackages();
  const saveMutation = useSavePackage();
  const deleteMutation = useDeletePackage();

  const [editing, setEditing] = useState<Partial<PaymentPackage> | null>(null);
  const [featuresText, setFeaturesText] = useState('');

  const startEdit = (pkg: PaymentPackage) => {
    setEditing({ ...pkg });
    setFeaturesText((pkg.features ?? []).join('\n'));
  };

  const startCreate = () => {
    setEditing(emptyPackage());
    setFeaturesText('');
  };

  const handleSave = async () => {
    if (!editing) return;
    const data = {
      ...editing,
      features: featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };
    await saveMutation.mutateAsync(data);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // If editing, show the form
  if (editing) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">
            {editing.id ? 'Edit package' : 'New package'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1.5 text-[13px] text-gray-400 border border-white/[0.08] rounded-md hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-[13px] text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] text-gray-400 mb-1">Slug</label>
            <input
              type="text"
              value={editing.slug ?? ''}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] text-gray-400 mb-1">Description</label>
            <textarea
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] resize-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Price</label>
              <input
                type="number"
                value={editing.price ?? 0}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Currency</label>
              <input
                type="text"
                value={editing.currency ?? 'USD'}
                onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Billing period</label>
              <select
                value={editing.billing_period ?? 'monthly'}
                onChange={(e) => setEditing({ ...editing, billing_period: e.target.value })}
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannual">Biannual</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Concurrent jobs</label>
              <input
                type="number"
                value={editing.quota_limits?.concurrent_jobs ?? 1}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    quota_limits: {
                      ...editing.quota_limits,
                      concurrent_jobs: Number(e.target.value),
                    },
                  })
                }
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Keywords limit</label>
              <input
                type="number"
                value={editing.quota_limits?.keywords_limit ?? 10}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    quota_limits: {
                      ...editing.quota_limits,
                      keywords_limit: Number(e.target.value),
                    },
                  })
                }
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] text-gray-400 mb-1">
              Features (one per line)
            </label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] resize-none font-mono transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-gray-400 mb-1">Sort order</label>
              <input
                type="number"
                value={editing.sort_order ?? 0}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div className="flex items-end pb-1.5 gap-3">
              <label className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active !== false}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editing.is_popular}
                  onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                Popular
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Package list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Packages</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {(packages ?? []).length} packages configured
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New package
        </button>
      </div>

      {(packages ?? []).length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-600">No packages yet</p>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_80px_80px_70px_70px_60px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>Package</span>
            <span>Price</span>
            <span>Period</span>
            <span>Jobs</span>
            <span>Keywords</span>
            <span />
          </div>
          <div className="border-t border-white/[0.04]">
            {(packages ?? []).map((pkg: PaymentPackage) => (
              <div
                key={pkg.id}
                onClick={() => startEdit(pkg)}
                className="grid grid-cols-[1fr_80px_80px_70px_70px_60px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-white font-medium">{pkg.name}</span>
                    {!pkg.is_active && (
                      <span className="text-[10px] text-gray-600">inactive</span>
                    )}
                  </div>
                  <div className="text-[12px] text-gray-600 truncate">{pkg.description}</div>
                </div>
                <div className="flex items-center text-[13px] text-gray-300 tabular-nums">
                  {pkg.currency} {pkg.price}
                </div>
                <div className="flex items-center text-[12px] text-gray-500">
                  {pkg.billing_period}
                </div>
                <div className="flex items-center text-[13px] text-gray-400 tabular-nums">
                  {pkg.quota_limits?.concurrent_jobs ?? '—'}
                </div>
                <div className="flex items-center text-[13px] text-gray-400 tabular-nums">
                  {pkg.quota_limits?.keywords_limit ?? '—'}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pkg.id);
                    }}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
