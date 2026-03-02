'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useAdminPackages, useSavePackage, useDeletePackage, type PaymentPackage, type PricingTier } from '@/hooks';

function emptyPackage(): Partial<PaymentPackage> {
  return { name: '', slug: '', description: '', price: 0, currency: 'USD', billing_period: 'monthly', features: [], quota_limits: { concurrent_jobs: 1, keywords_limit: 10 }, is_active: true, sort_order: 0, pricing_tiers: [] };
}

const inputClass = "w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

export default function PackagesPage() {
  const { data: packages, isLoading } = useAdminPackages();
  const saveMutation = useSavePackage();
  const deleteMutation = useDeletePackage();

  const [editing, setEditing] = useState<Partial<PaymentPackage> | null>(null);
  const [featuresText, setFeaturesText] = useState('');

  const startEdit = (pkg: PaymentPackage) => { setEditing({ ...pkg }); setFeaturesText((pkg.features ?? []).join('\n')); };
  const startCreate = () => { setEditing(emptyPackage()); setFeaturesText(''); };

  const handleSave = async () => {
    if (!editing) return;
    const data = { ...editing, features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean) };
    await saveMutation.mutateAsync(data);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse" />)}</div>;

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{editing.id ? 'Edit Package' : 'New Package'}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saveMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input type="text" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
              <input type="text" value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className={inputClass + ' resize-none'} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
              <input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <input type="text" value={editing.currency ?? 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Billing period</label>
              <select value={editing.billing_period ?? 'monthly'} onChange={(e) => setEditing({ ...editing, billing_period: e.target.value })} className={inputClass}>
                <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="biannual">Biannual</option><option value="annual">Annual</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Concurrent jobs</label>
              <input type="number" value={editing.quota_limits?.concurrent_jobs ?? 1} onChange={(e) => setEditing({ ...editing, quota_limits: { ...editing.quota_limits, concurrent_jobs: Number(e.target.value) } })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords limit</label>
              <input type="number" value={editing.quota_limits?.keywords_limit ?? 10} onChange={(e) => setEditing({ ...editing, quota_limits: { ...editing.quota_limits, keywords_limit: Number(e.target.value) } })} className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Features (one per line)</label>
            <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={5} className={inputClass + ' resize-none font-mono'} /></div>
          <div className="flex items-center gap-6 pt-2">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
              <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={inputClass + ' w-24'} /></div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-5">
              <input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Active</label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-5">
              <input type="checkbox" checked={!!editing.is_popular} onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Popular</label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">{(packages ?? []).length} packages configured</p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> New package
        </button>
      </div>

      {(packages ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-400">No packages yet. Create your first package.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(packages ?? []).map((pkg: PaymentPackage) => (
            <div key={pkg.id} onClick={() => startEdit(pkg)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{pkg.name}</h3>
                  {!pkg.is_active && <span className="text-[10px] font-medium text-gray-400 uppercase">Inactive</span>}
                  {pkg.is_popular && <span className="ml-2 inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700">Popular</span>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(pkg.id); }} className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{pkg.description || 'No description'}</p>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{pkg.currency} {pkg.price}<span className="text-sm font-normal text-gray-500">/{pkg.billing_period}</span></div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                <span>{pkg.quota_limits?.concurrent_jobs ?? '\u2014'} jobs</span>
                <span>{pkg.quota_limits?.keywords_limit ?? '\u2014'} keywords</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
