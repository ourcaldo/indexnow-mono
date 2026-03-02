'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Star, StarOff } from 'lucide-react';
import {
  useAdminPaymentSettings,
  useSavePaymentGateway,
  useDeletePaymentGateway,
  useSetDefaultPaymentGateway,
  type UI_PaymentGateway,
} from '@/hooks';

function emptyGateway(): Partial<UI_PaymentGateway> {
  return {
    name: '',
    slug: 'paddle',
    is_active: true,
    is_default: false,
    configuration: {} as any,
    api_credentials: {} as any,
  };
}

export default function PaymentsPage() {
  const { data: gateways, isLoading } = useAdminPaymentSettings();
  const saveMutation = useSavePaymentGateway();
  const deleteMutation = useDeletePaymentGateway();
  const setDefaultMutation = useSetDefaultPaymentGateway();

  const [editing, setEditing] = useState<Partial<UI_PaymentGateway> | null>(null);

  const startEdit = (gw: UI_PaymentGateway) => {
    setEditing({ ...gw });
  };

  const startCreate = () => {
    setEditing(emptyGateway());
  };

  const handleSave = async () => {
    if (!editing) return;
    await saveMutation.mutateAsync(editing);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment gateway?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">
            {editing.id ? 'Edit gateway' : 'New gateway'}
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
            <label className="block text-[13px] text-gray-400 mb-1">Gateway name</label>
            <input
              type="text"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] text-gray-400 mb-1">Type</label>
            <select
              value={editing.slug ?? 'paddle'}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none"
            >
              <option value="paddle">Paddle</option>
              <option value="manual">Manual</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* API Credentials */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[13px] text-gray-300">API Credentials</h3>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">API Key</label>
              <input
                type="password"
                value={(editing.api_credentials as any)?.api_key ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    api_credentials: { ...editing.api_credentials, api_key: e.target.value } as any,
                  })
                }
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">Webhook Secret</label>
              <input
                type="password"
                value={(editing.api_credentials as any)?.webhook_secret ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    api_credentials: {
                      ...editing.api_credentials,
                      webhook_secret: e.target.value,
                    } as any,
                  })
                }
                className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[13px] text-gray-300">Configuration</h3>
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">Sandbox mode</label>
              <label className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(editing.configuration as any)?.sandbox}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      configuration: {
                        ...editing.configuration,
                        sandbox: e.target.checked,
                      } as any,
                    })
                  }
                  className="rounded border-white/20 bg-white/5"
                />
                Enable sandbox
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.is_active !== false}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="rounded border-white/20 bg-white/5"
              />
              Active
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Payment Gateways</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {(gateways ?? []).length} gateways configured
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add gateway
        </button>
      </div>

      {(gateways ?? []).length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-600">No payment gateways configured</p>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_100px_80px_80px_60px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>Gateway</span>
            <span>Type</span>
            <span>Status</span>
            <span>Default</span>
            <span />
          </div>
          <div className="border-t border-white/[0.04]">
            {(gateways ?? []).map((gw: UI_PaymentGateway) => (
              <div
                key={gw.id}
                onClick={() => startEdit(gw)}
                className="grid grid-cols-[1fr_100px_80px_80px_60px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="text-[13px] text-white font-medium">{gw.name}</div>
                <div className="flex items-center text-[13px] text-gray-400">
                  {gw.slug}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${gw.is_active ? 'bg-emerald-400' : 'bg-gray-600'}`}
                  />
                  <span className="text-[12px] text-gray-500">
                    {gw.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!gw.is_default) handleSetDefault(gw.id);
                    }}
                    className={`p-1 transition-colors ${
                      gw.is_default
                        ? 'text-amber-400'
                        : 'text-gray-700 hover:text-amber-400'
                    }`}
                    title={gw.is_default ? 'Default gateway' : 'Set as default'}
                  >
                    {gw.is_default ? (
                      <Star className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <StarOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(gw.id);
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
