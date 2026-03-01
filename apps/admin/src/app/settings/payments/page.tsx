'use client';

import { useState } from 'react';
import { CreditCard, Plus, Edit3, Trash2, Save } from 'lucide-react';
import {
  type PaymentGatewayConfiguration,
  type PaymentGatewayCredentials,
  logger,
} from '@indexnow/shared';
import {
  useAdminPaymentSettings,
  useSavePaymentGateway,
  useDeletePaymentGateway,
  useSetDefaultPaymentGateway,
  type UI_PaymentGateway,
} from '@/hooks';

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#141520] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400';

function GatewayForm({
  gateway,
  onSave,
  onCancel,
}: {
  gateway: Partial<UI_PaymentGateway>;
  onSave: (g: Partial<UI_PaymentGateway>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<UI_PaymentGateway>>({
    ...gateway,
    configuration: gateway.configuration || {},
    api_credentials: gateway.api_credentials || {},
  });

  const updateField = <K extends keyof UI_PaymentGateway>(field: K, value: UI_PaymentGateway[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const updateConfig = <K extends keyof PaymentGatewayConfiguration>(field: K, value: PaymentGatewayConfiguration[K]) =>
    setFormData((prev) => ({ ...prev, configuration: { ...(prev.configuration || {}), [field]: value } }));
  const updateCreds = <K extends keyof PaymentGatewayCredentials>(field: K, value: PaymentGatewayCredentials[K]) =>
    setFormData((prev) => ({ ...prev, api_credentials: { ...(prev.api_credentials || {}), [field]: value } }));

  const isPaddle = formData.slug === 'paddle';

  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input type="text" value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} className={inputCls} placeholder="Paddle" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
          <input type="text" value={formData.slug || ''} onChange={(e) => updateField('slug', e.target.value)} className={inputCls} placeholder="paddle" />
        </div>

        {isPaddle && (
          <>
            <div className="md:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Paddle Billing API</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Handles subscriptions, tax calculation, and global compliance.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Environment</label>
              <select value={formData.configuration?.environment || 'sandbox'} onChange={(e) => updateConfig('environment', e.target.value as 'sandbox' | 'production')} className={inputCls}>
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vendor ID</label>
              <input type="text" value={String(formData.configuration?.vendor_id || '')} onChange={(e) => updateConfig('vendor_id', e.target.value)} className={inputCls} placeholder="12345" />
              <p className="mt-1 text-xs text-gray-400">Settings → Authentication in Paddle dashboard</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">API Key</label>
              <input type="password" value={formData.api_credentials?.api_key || ''} onChange={(e) => updateCreds('api_key', e.target.value)} className={inputCls} placeholder="paddle_api_..." />
              <p className="mt-1 text-xs text-gray-400">Stored encrypted. Prefer PADDLE_API_KEY env var.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Webhook Secret</label>
              <input type="password" value={formData.api_credentials?.webhook_secret || ''} onChange={(e) => updateCreds('webhook_secret', e.target.value)} className={inputCls} placeholder="pdl_ntfset_..." />
              <p className="mt-1 text-xs text-gray-400">For verifying event signatures. Prefer PADDLE_WEBHOOK_SECRET env var.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client Token</label>
              <input type="text" value={formData.api_credentials?.client_token || ''} onChange={(e) => updateCreds('client_token', e.target.value)} className={inputCls} placeholder="test_... or live_..." />
              <p className="mt-1 text-xs text-gray-400">Safe to expose. Used for Paddle.js initialization.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Webhook URL</label>
              <input type="url" readOnly value={String(formData.configuration?.webhook_url || '')} onChange={(e) => updateConfig('webhook_url', e.target.value)} className={`${inputCls} opacity-60`} placeholder="https://yourdomain.com/api/paddle/webhook" />
              <p className="mt-1 text-xs text-gray-400">Configure in Paddle dashboard → Developer Tools → Notifications</p>
            </div>
          </>
        )}

        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={formData.is_active || false} onChange={(e) => updateField('is_active', e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={formData.is_default || false} onChange={(e) => updateField('is_default', e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
            Default
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(formData)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity">
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}

export default function PaymentGateways() {
  const { data: gateways = [], isLoading } = useAdminPaymentSettings();
  const saveGatewayMutation = useSavePaymentGateway();
  const deleteGatewayMutation = useDeletePaymentGateway();
  const setDefaultMutation = useSetDefaultPaymentGateway();

  const [editingGateway, setEditingGateway] = useState<UI_PaymentGateway | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async (gateway: Partial<UI_PaymentGateway>) => {
    try {
      await saveGatewayMutation.mutateAsync(gateway);
      setMsg({ ok: true, text: `Gateway ${gateway.id ? 'updated' : 'created'}.` });
      setEditingGateway(null);
      setIsCreating(false);
    } catch (err) {
      logger.error({ err: err as Error }, 'Failed to save gateway');
      setMsg({ ok: false, text: 'Failed to save gateway.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this payment gateway? This cannot be undone.')) return;
    try {
      await deleteGatewayMutation.mutateAsync(id);
      setMsg({ ok: true, text: 'Gateway deleted.' });
    } catch (err) {
      logger.error({ err: err as Error }, 'Failed to delete gateway');
      setMsg({ ok: false, text: 'Failed to delete gateway.' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id);
      setMsg({ ok: true, text: 'Default gateway updated.' });
    } catch (err) {
      logger.error({ err: err as Error }, 'Failed to set default');
      setMsg({ ok: false, text: 'Failed to set default.' });
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading gateways…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Gateways</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {gateways.length} gateway{gateways.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add gateway
          </button>
        )}
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-md border ${msg.ok ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          {msg.text}
        </div>
      )}

      {isCreating && (
        <GatewayForm gateway={{}} onSave={handleSave} onCancel={() => setIsCreating(false)} />
      )}

      <div className="space-y-3">
        {gateways.map((gateway) =>
          editingGateway?.id === gateway.id ? (
            <GatewayForm
              key={gateway.id}
              gateway={editingGateway}
              onSave={handleSave}
              onCancel={() => setEditingGateway(null)}
            />
          ) : (
            <div
              key={gateway.id}
              className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{gateway.name}</span>
                    {gateway.is_default && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">Default</span>
                    )}
                    <span className={`text-xs ${gateway.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {gateway.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{gateway.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!gateway.is_default && (
                  <button
                    onClick={() => handleSetDefault(gateway.id)}
                    className="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => setEditingGateway(gateway)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(gateway.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        )}
        {gateways.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No payment gateways configured.{' '}
            <button onClick={() => setIsCreating(true)} className="underline">Add one</button>
          </div>
        )}
      </div>
    </div>
  );
}
