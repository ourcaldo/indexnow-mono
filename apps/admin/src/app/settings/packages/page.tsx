'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Star,
  Clock,
  Users,
  Zap,
  Search,
} from 'lucide-react';
import { AdminPageSkeleton } from '@indexnow/ui';
import { ConfirmationDialog } from '@indexnow/ui/modals';
import { PackageForm } from './components/PackageForm';
import { useAdminPackages, useSavePackage, useDeletePackage, type PaymentPackage } from '@/hooks';

export default function PackageManagement() {
  const { data: packages = [], isLoading: loading } = useAdminPackages();
  const savePackageMutation = useSavePackage();
  const deletePackageMutation = useDeletePackage();

  const [editingPackage, setEditingPackage] = useState<PaymentPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: 'destructive' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleSave = async (packageData: Partial<PaymentPackage>) => {
    try {
      await savePackageMutation.mutateAsync(packageData);
      setMessage({
        type: 'success',
        text: `Package ${packageData.id ? 'updated' : 'created'} successfully!`,
      });
      setEditingPackage(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to save package:', err);
      setMessage({ type: 'error', text: 'Failed to save package' });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Package',
      message: 'Are you sure you want to delete this package? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deletePackageMutation.mutateAsync(id);
          setMessage({ type: 'success', text: 'Package deleted successfully!' });
        } catch (err) {
          console.error('Failed to delete package:', err);
          setMessage({ type: 'error', text: 'Failed to delete package' });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (loading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Package Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription packages and pricing tiers
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Package</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center space-x-2 rounded-lg border p-4 ${
            message.type === 'success'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <PackageForm packageData={{}} onSave={handleSave} onCancel={() => setIsCreating(false)} />
      )}

      {/* Packages List */}
      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id}>
            {editingPackage?.id === pkg.id ? (
              <PackageForm
                packageData={editingPackage}
                onSave={handleSave}
                onCancel={() => setEditingPackage(null)}
              />
            ) : (
              <div className="border-border rounded-lg border bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Package className="text-accent h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-foreground text-lg font-semibold">{pkg.name}</h3>
                        {pkg.is_popular && (
                          <span className="bg-warning/10 text-warning border-warning/20 flex items-center space-x-1 rounded-full border px-2 py-1 text-xs font-medium">
                            <Star className="h-3 w-3" />
                            <span>Popular</span>
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${
                            pkg.is_active
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-muted/50 text-muted-foreground border-muted'
                          }`}
                        >
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">{pkg.description}</p>
                      <p className="text-muted-foreground mt-1 text-xs">Slug: {pkg.slug}</p>

                      {/* Package Details */}
                      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{pkg.quota_limits?.concurrent_jobs || 0} Concurrent Jobs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Search className="text-success h-4 w-4" />
                          <span>
                            {pkg.quota_limits?.keywords_limit === -1
                              ? 'Unlimited'
                              : pkg.quota_limits?.keywords_limit || 0}{' '}
                            Keywords
                          </span>
                        </div>
                      </div>

                      {/* Features Preview */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="mt-2">
                          <p className="text-muted-foreground text-xs font-medium">Features:</p>
                          <p className="text-muted-foreground text-xs">
                            {pkg.features.slice(0, 3).join(', ')}
                            {pkg.features.length > 3 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPackage(pkg)}
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {packages.length === 0 && (
          <div className="py-12 text-center">
            <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No packages configured</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-accent mt-4 hover:underline"
            >
              Create your first package
            </button>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
}
