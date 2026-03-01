'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { logger } from '@indexnow/shared';
import { PackageForm } from './components/PackageForm';
import { useAdminPackages, useSavePackage, useDeletePackage, type PaymentPackage } from '@/hooks';

export default function PackageManagement() {
  const { data: packages = [], isLoading } = useAdminPackages();
  const savePackageMutation = useSavePackage();
  const deletePackageMutation = useDeletePackage();

  const [editingPackage, setEditingPackage] = useState<PaymentPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async (packageData: Partial<PaymentPackage>) => {
    try {
      await savePackageMutation.mutateAsync(packageData);
      setMsg({ ok: true, text: `Package ${packageData.id ? 'updated' : 'created'}.` });
      setEditingPackage(null);
      setIsCreating(false);
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Failed to save package');
      setMsg({ ok: false, text: 'Failed to save package.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this package? This cannot be undone.')) return;
    try {
      await deletePackageMutation.mutateAsync(id);
      setMsg({ ok: true, text: 'Package deleted.' });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Failed to delete package');
      setMsg({ ok: false, text: 'Failed to delete package.' });
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading packages…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Packages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {packages.length} package{packages.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white/10 text-white border border-gray-700 dark:border-white/10 rounded-md hover:bg-gray-800 dark:hover:bg-white/[0.15] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add package
          </button>
        )}
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-md border ${msg.ok ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          {msg.text}
        </div>
      )}

      {/* Create form */}
      {isCreating && (
        <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <PackageForm packageData={{}} onSave={handleSave} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      {/* Packages table */}
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {packages.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No packages configured.{' '}
            <button onClick={() => setIsCreating(true)} className="underline">Create one</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Jobs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Keywords</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) =>
                editingPackage?.id === pkg.id ? (
                  <tr key={pkg.id}>
                    <td colSpan={6} className="px-4 py-4">
                      <PackageForm
                        packageData={editingPackage}
                        onSave={handleSave}
                        onCancel={() => setEditingPackage(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={pkg.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</div>
                      {pkg.is_popular && <div className="text-xs text-amber-600 dark:text-amber-400">Popular</div>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{pkg.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 tabular-nums">{pkg.quota_limits?.concurrent_jobs ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                      {pkg.quota_limits?.keywords_limit === -1 ? 'Unlimited' : (pkg.quota_limits?.keywords_limit ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${pkg.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingPackage(pkg)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          disabled={deletePackageMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

