'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Star, StarOff, X } from 'lucide-react';
import { useAdminPaymentSettings, useSavePaymentGateway, useDeletePaymentGateway, useSetDefaultPaymentGateway, type UI_PaymentGateway } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';

function emptyGateway(): Partial<UI_PaymentGateway> {
  return { name: '', slug: 'paddle', is_active: true, is_default: false, configuration: {} as any, api_credentials: {} as any };
}

const inputClass = "w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

export default function PaymentsPage() {
  useAdminPageViewLogger('settings', 'Payments');
  const { data: gateways, isLoading } = useAdminPaymentSettings();
  const saveMutation = useSavePaymentGateway();
  const deleteMutation = useDeletePaymentGateway();
  const setDefaultMutation = useSetDefaultPaymentGateway();

  const [editing, setEditing] = useState<Partial<UI_PaymentGateway> | null>(null);

  const startEdit = (gw: UI_PaymentGateway) => setEditing({ ...gw, api_credentials: { webhook_secret: '' } as any });
  const startCreate = () => setEditing(emptyGateway());
  const handleSave = async () => {
    if (!editing) return;
    // Only send api_credentials if user entered new values (not empty)
    const creds = editing.api_credentials as Record<string, string> | undefined;
    const payload: Partial<UI_PaymentGateway> = { ...editing };
    if (creds) {
      const cleanCreds: Record<string, string> = {};
      let hasValues = false;
      for (const [k, v] of Object.entries(creds)) {
        if (v && !v.startsWith('••••')) { cleanCreds[k] = v; hasValues = true; }
      }
      if (hasValues) {
        payload.api_credentials = cleanCreds as any;
      } else {
        delete payload.api_credentials;
      }
    }
    await saveMutation.mutateAsync(payload);
    setEditing(null);
  };
  const handleDelete = async (id: string) => { if (!confirm('Delete this payment gateway?')) return; await deleteMutation.mutateAsync(id); };
  const handleSetDefault = async (id: string) => await setDefaultMutation.mutateAsync(id);

  if (isLoading) return <div className="bg-white min-h-full"><div className="px-8 py-5 border-b border-gray-200"><div className="h-6 w-32 bg-gray-100 rounded animate-pulse" /></div><div className="px-8 py-5 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 h-20 animate-pulse" />)}</div></div>;

  if (editing) {
    return (
      <div className="bg-white min-h-full">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{editing.id ? 'Edit Gateway' : 'New Gateway'}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"><X className="w-4 h-4" /> Cancel</button>
            <button onClick={handleSave} disabled={saveMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"><Save className="w-4 h-4" /> Save</button>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Gateway name</label><input type="text" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={editing.slug ?? 'paddle'} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputClass}>
                <option value="paddle">Paddle</option><option value="manual">Manual</option><option value="bank_transfer">Bank Transfer</option>
              </select></div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Webhook Secret</h4>
            <p className="text-xs text-gray-400 mb-2">Used to verify incoming Paddle webhook signatures. Client token is set via environment variable.</p>
            <div><input type="password" placeholder={editing.id ? 'Enter new value to update' : 'pdl_ntfset_...'} value={(editing.api_credentials as any)?.webhook_secret ?? ''} onChange={(e) => setEditing({ ...editing, api_credentials: { webhook_secret: e.target.value } as any })} className={inputClass} /></div>
          </div>
          <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={!!(editing.configuration as any)?.sandbox} onChange={(e) => setEditing({ ...editing, configuration: { ...editing.configuration, sandbox: e.target.checked } as any })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Sandbox mode</label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Active</label>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-sm text-gray-500 mt-0.5">{(gateways ?? []).length} gateways configured</p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all"><Plus className="w-4 h-4" /> Add gateway</button>
      </div>

      {(gateways ?? []).length === 0 ? (
        <div className="px-8 py-16 text-center"><p className="text-sm text-gray-400">No payment gateways configured</p></div>
      ) : (
        <div className="px-8 py-6 space-y-3">
          {(gateways ?? []).map((gw: UI_PaymentGateway) => (
            <div key={gw.id} onClick={() => startEdit(gw)} className="rounded-xl border border-gray-200 p-5 hover:border-gray-300 cursor-pointer transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gw.is_active ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <span className={`text-xs font-bold ${gw.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>{gw.slug?.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{gw.name}</h3>
                    {gw.is_default && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700"><Star className="w-2.5 h-2.5 fill-current" /> Default</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{gw.slug} &middot; {gw.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!gw.is_default && (
                  <button onClick={(e) => { e.stopPropagation(); handleSetDefault(gw.id); }} className="p-2 text-gray-400 hover:text-amber-500 transition-colors" title="Set as default">
                    <StarOff className="w-4 h-4" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(gw.id); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
