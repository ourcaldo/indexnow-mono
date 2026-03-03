'use client';

import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { useAdminSiteSettings, useSaveSiteSettings, useTestEmail, type UI_SiteSettings } from '@/hooks';
import { useAdminPageViewLogger, ToggleSwitch } from '@indexnow/ui';

function FormCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-4 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1.5">{description}</p>}
      {children}
    </div>
  );
}

const inputClass = "w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

export default function SiteSettingsPage() {
  useAdminPageViewLogger('settings', 'Site Settings');
  const { data: settings, isLoading } = useAdminSiteSettings();
  const saveMutation = useSaveSiteSettings();
  const testEmailMutation = useTestEmail();

  const [form, setForm] = useState<Partial<UI_SiteSettings>>({});
  const [testEmailTo, setTestEmailTo] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => { if (settings) setForm({ ...settings }); }, [settings]);

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form) return;
    try { await saveMutation.mutateAsync(form as UI_SiteSettings); setSaveMsg('Saved'); setTimeout(() => setSaveMsg(''), 2000); }
    catch { setSaveMsg('Failed'); }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    try {
      await testEmailMutation.mutateAsync({ to: testEmailTo, smtp_host: form.smtp_host, smtp_port: form.smtp_port, smtp_user: form.smtp_user, smtp_pass: form.smtp_pass, smtp_from_email: form.smtp_from_email, smtp_from_name: form.smtp_from_name });
      alert('Test email sent');
    } catch (err: any) { alert(err.message || 'Failed to send test email'); }
  };

  if (isLoading) {
    return <div className="bg-white min-h-full"><div className="px-8 py-5 border-b border-gray-200"><div className="h-6 w-32 bg-gray-100 rounded animate-pulse" /></div><div className="px-8 py-5 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 h-48 animate-pulse" />)}</div></div>;
  }

  return (
    <div className="bg-white min-h-full">
      {/* ─── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">General platform configuration</p>
        </div>
        <button onClick={handleSave} disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-40">
          <Save className="w-4 h-4" /> {saveMsg || 'Save changes'}
        </button>
      </div>

      {/* ─── Form content ────────────────────────────────── */}
      <div className="px-8 py-6 space-y-6 max-w-3xl">

      <FormCard title="General" description="Basic site information">
        <Field label="Site name" description="Displayed in browser title and emails">
          <input type="text" value={form.site_name ?? ''} onChange={(e) => update('site_name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Tagline">
          <input type="text" value={form.site_tagline ?? ''} onChange={(e) => update('site_tagline', e.target.value)} className={inputClass} />
        </Field>
        <div className="flex items-center justify-between">
          <Field label="Maintenance mode" description="Block user access during maintenance"><div /></Field>
          <ToggleSwitch checked={!!form.maintenance_mode} onChange={(v) => update('maintenance_mode', v)} />
        </div>
        <div className="flex items-center justify-between">
          <Field label="Registration" description="Allow new user sign-ups"><div /></Field>
          <ToggleSwitch checked={form.registration_enabled !== false} onChange={(v) => update('registration_enabled', v)} />
        </div>
      </FormCard>

      <FormCard title="Email (SMTP)" description="Configure outbound email delivery">
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host"><input type="text" value={form.smtp_host ?? ''} onChange={(e) => update('smtp_host', e.target.value)} placeholder="smtp.example.com" className={inputClass} /></Field>
          <Field label="SMTP Port"><input type="number" value={form.smtp_port ?? ''} onChange={(e) => update('smtp_port', Number(e.target.value))} placeholder="587" className={inputClass} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP User"><input type="text" value={form.smtp_user ?? ''} onChange={(e) => update('smtp_user', e.target.value)} className={inputClass} /></Field>
          <Field label="SMTP Password"><input type="password" value={form.smtp_pass ?? ''} onChange={(e) => update('smtp_pass', e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From email"><input type="email" value={form.smtp_from_email ?? ''} onChange={(e) => update('smtp_from_email', e.target.value)} placeholder="noreply@example.com" className={inputClass} /></Field>
          <Field label="From name"><input type="text" value={form.smtp_from_name ?? ''} onChange={(e) => update('smtp_from_name', e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Send a test email to verify your configuration</p>
          <div className="flex items-center gap-3">
            <input type="email" placeholder="recipient@example.com" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} className={inputClass + ' max-w-xs'} />
            <button onClick={handleTestEmail} disabled={testEmailMutation.isPending || !testEmailTo.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all">
              <Send className="w-4 h-4" /> Send test
            </button>
          </div>
        </div>
      </FormCard>
      </div>
    </div>
  );
}
