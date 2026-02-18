'use client';

import { useState } from 'react';
import { CreditCard, Plus, Edit3, Trash2, CheckCircle, AlertTriangle, Save, X } from 'lucide-react';
import {
  type PaymentGatewayConfiguration,
  type PaymentGatewayCredentials,
  logger,
} from '@indexnow/shared';
import { AdminPageSkeleton } from '@indexnow/ui';
import { ConfirmationDialog } from '@indexnow/ui/modals';
import {
  useAdminPaymentSettings,
  useSavePaymentGateway,
  useDeletePaymentGateway,
  useSetDefaultPaymentGateway,
  type UI_PaymentGateway,
} from '@/hooks';

export default function PaymentGateways() {
  const { data: gateways = [], isLoading: loading } = useAdminPaymentSettings();
  const saveGatewayMutation = useSavePaymentGateway();
  const deleteGatewayMutation = useDeletePaymentGateway();
  const setDefaultMutation = useSetDefaultPaymentGateway();

  const [editingGateway, setEditingGateway] = useState<UI_PaymentGateway | null>(null);
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

  const handleSave = async (gateway: Partial<UI_PaymentGateway>) => {
    try {
      await saveGatewayMutation.mutateAsync(gateway);
      setMessage({
        type: 'success',
        text: `Payment gateway ${gateway.id ? 'updated' : 'created'} successfully!`,
      });
      setEditingGateway(null);
      setIsCreating(false);
    } catch (err) {
      logger.error({ err: err as Error }, 'Failed to save payment gateway');
      setMessage({ type: 'error', text: 'Failed to save payment gateway' });
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Gateway',
      message:
        'Are you sure you want to delete this payment gateway? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteGatewayMutation.mutateAsync(id);
          setMessage({ type: 'success', text: 'Payment gateway deleted successfully!' });
        } catch (err) {
          logger.error({ err: err as Error }, 'Failed to delete payment gateway');
          setMessage({ type: 'error', text: 'Failed to delete payment gateway' });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      setMessage({ type: 'success', text: 'Default payment gateway updated!' });
    } catch (err) {
      logger.error({ err: err as Error }, 'Failed to update default gateway');
      setMessage({ type: 'error', text: 'Failed to update default gateway' });
    }
  };

  const GatewayForm = ({
    gateway,
    onSave,
    onCancel,
  }: {
    gateway: Partial<UI_PaymentGateway>;
    onSave: (gateway: Partial<UI_PaymentGateway>) => void;
    onCancel: () => void;
  }) => {
    // Initialize defaults if undefined
    const [formData, setFormData] = useState<Partial<UI_PaymentGateway>>({
      ...gateway,
      configuration: gateway.configuration || {},
      api_credentials: gateway.api_credentials || {},
    });

    const updateField = <K extends keyof UI_PaymentGateway>(
      field: K,
      value: UI_PaymentGateway[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const updateConfigurationField = <K extends keyof PaymentGatewayConfiguration>(
      field: K,
      value: PaymentGatewayConfiguration[K]
    ) => {
      setFormData((prev) => ({
        ...prev,
        configuration: {
          ...(prev.configuration || {}),
          [field]: value,
        },
      }));
    };

    const updateCredentialsField = <K extends keyof PaymentGatewayCredentials>(
      field: K,
      value: PaymentGatewayCredentials[K]
    ) => {
      setFormData((prev) => ({
        ...prev,
        api_credentials: {
          ...(prev.api_credentials || {}),
          [field]: value,
        },
      }));
    };

    return (
      <div className="border-border rounded-lg border bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="PayPal"
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Slug</label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
              className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="paypal"
            />
          </div>

          {/* Paddle Configuration */}
          {formData.slug === 'paddle' && (
            <>
              <div className="md:col-span-2">
                <h3 className="text-foreground border-border mb-4 border-b pb-2 text-lg font-medium">
                  Paddle Billing API Configuration
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Configure your Paddle credentials for subscription billing and payments. Paddle
                  handles all payment methods, tax calculation, and compliance globally.
                </p>
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Environment
                </label>
                <select
                  value={formData.configuration?.environment || 'sandbox'}
                  onChange={(e) =>
                    updateConfigurationField(
                      'environment',
                      e.target.value as 'sandbox' | 'production'
                    )
                  }
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Vendor ID</label>
                <input
                  type="text"
                  value={String(formData.configuration?.vendor_id || '')}
                  onChange={(e) => updateConfigurationField('vendor_id', e.target.value)}
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="12345"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Your Paddle Vendor ID from Settings → Authentication
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-foreground mb-2 block text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={formData.api_credentials?.api_key || ''}
                  onChange={(e) => updateCredentialsField('api_key', e.target.value)}
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="paddle_api_..."
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  API key will be encrypted before storing in database. Recommended: Store in
                  environment variables (PADDLE_API_KEY).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Webhook Secret
                </label>
                <input
                  type="password"
                  value={formData.api_credentials?.webhook_secret || ''}
                  onChange={(e) => updateCredentialsField('webhook_secret', e.target.value)}
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="pdl_ntfset_..."
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Webhook secret for verifying event signatures. Recommended: Store in environment
                  variables (PADDLE_WEBHOOK_SECRET).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Client Token
                </label>
                <input
                  type="text"
                  value={formData.api_credentials?.client_token || ''}
                  onChange={(e) => updateCredentialsField('client_token', e.target.value)}
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="test_... or live_..."
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Client-side token for Paddle.js initialization. This is safe to expose in the
                  browser and will be served via the config API.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={String(formData.configuration?.webhook_url || '')}
                  onChange={(e) => updateConfigurationField('webhook_url', e.target.value)}
                  className="border-border focus:ring-accent w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                  placeholder="https://yourdomain.com/api/paddle/webhook"
                  readOnly
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  This webhook URL should be configured in your Paddle dashboard under Developer
                  Tools → Notifications
                </p>
              </div>
            </>
          )}

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
                checked={formData.is_default || false}
                onChange={(e) => updateField('is_default', e.target.checked)}
                className="border-border text-accent rounded focus:border-transparent"
              />
              <span className="text-foreground ml-2 text-sm">Default</span>
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
            onClick={() => onSave(formData)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Payment Gateways</h1>
          <p className="text-muted-foreground mt-1">
            Manage payment methods and processing options
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Gateway</span>
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
        <GatewayForm gateway={{}} onSave={handleSave} onCancel={() => setIsCreating(false)} />
      )}

      {/* Payment Gateways List */}
      <div className="space-y-4">
        {gateways.map((gateway) => (
          <div key={gateway.id}>
            {editingGateway?.id === gateway.id ? (
              <GatewayForm
                gateway={editingGateway}
                onSave={handleSave}
                onCancel={() => setEditingGateway(null)}
              />
            ) : (
              <div className="border-border rounded-lg border bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <CreditCard className="text-accent h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-foreground text-lg font-semibold">{gateway.name}</h3>
                        {gateway.is_default && (
                          <span className="bg-success/10 text-success border-success/20 rounded-full border px-2 py-1 text-xs font-medium">
                            Default
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${
                            gateway.is_active
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-muted/10 text-muted-foreground border-muted/20'
                          }`}
                        >
                          {gateway.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">Slug: {gateway.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!gateway.is_default && (
                      <button
                        onClick={() => handleSetDefault(gateway.id)}
                        className="text-accent hover:bg-accent/10 rounded-lg px-3 py-1 text-sm transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setEditingGateway(gateway)}
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(gateway.id)}
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
      </div>

      {gateways.length === 0 && (
        <div className="py-12 text-center">
          <CreditCard className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">No payment gateways configured</p>
          <button onClick={() => setIsCreating(true)} className="text-accent mt-4 hover:underline">
            Add your first payment gateway
          </button>
        </div>
      )}

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
