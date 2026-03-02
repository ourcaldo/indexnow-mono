'use client';

import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { useAdminSiteSettings, useSaveSiteSettings, useTestEmail, type UI_SiteSettings } from '@/hooks';

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-white/[0.04] last:border-0 gap-8">
      <div className="flex-shrink-0 w-48">
        <div className="text-[13px] text-gray-200">{label}</div>
        {description && <div className="text-[12px] text-gray-600 mt-0.5">{description}</div>}
      </div>
      <div className="flex-1 max-w-sm">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SiteSettingsPage() {
  const { data: settings, isLoading } = useAdminSiteSettings();
  const saveMutation = useSaveSiteSettings();
  const testEmailMutation = useTestEmail();

  const [form, setForm] = useState<Partial<UI_SiteSettings>>({});
  const [testEmailTo, setTestEmailTo] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const update = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      await saveMutation.mutateAsync(form as UI_SiteSettings);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Failed to save');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    try {
      await testEmailMutation.mutateAsync({
        to: testEmailTo,
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        smtp_pass: form.smtp_pass,
        smtp_from_email: form.smtp_from_email,
        smtp_from_name: form.smtp_from_name,
      });
      alert('Test email sent');
    } catch (err: any) {
      alert(err.message || 'Failed to send test email');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Site Settings</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">General platform configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMsg || 'Save'}
        </button>
      </div>

      {/* General */}
      <section>
        <h2 className="text-sm font-medium text-white mb-1">General</h2>
        <div>
          <FieldRow label="Site name" description="Displayed in browser title and emails">
            <input
              type="text"
              value={form.site_name ?? ''}
              onChange={(e) => update('site_name', e.target.value)}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="Tagline">
            <input
              type="text"
              value={form.site_tagline ?? ''}
              onChange={(e) => update('site_tagline', e.target.value)}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="Maintenance mode" description="Block user access during maintenance">
            <Toggle
              checked={!!form.maintenance_mode}
              onChange={(v) => update('maintenance_mode', v)}
            />
          </FieldRow>
          <FieldRow label="Registration" description="Allow new user sign-ups">
            <Toggle
              checked={form.registration_enabled !== false}
              onChange={(v) => update('registration_enabled', v)}
            />
          </FieldRow>
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* SMTP */}
      <section>
        <h2 className="text-sm font-medium text-white mb-1">Email (SMTP)</h2>
        <div>
          <FieldRow label="SMTP Host">
            <input
              type="text"
              value={form.smtp_host ?? ''}
              onChange={(e) => update('smtp_host', e.target.value)}
              placeholder="smtp.example.com"
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="SMTP Port">
            <input
              type="number"
              value={form.smtp_port ?? ''}
              onChange={(e) => update('smtp_port', Number(e.target.value))}
              placeholder="587"
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="SMTP User">
            <input
              type="text"
              value={form.smtp_user ?? ''}
              onChange={(e) => update('smtp_user', e.target.value)}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="SMTP Password">
            <input
              type="password"
              value={form.smtp_pass ?? ''}
              onChange={(e) => update('smtp_pass', e.target.value)}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="From email">
            <input
              type="email"
              value={form.smtp_from_email ?? ''}
              onChange={(e) => update('smtp_from_email', e.target.value)}
              placeholder="noreply@example.com"
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
          <FieldRow label="From name">
            <input
              type="text"
              value={form.smtp_from_name ?? ''}
              onChange={(e) => update('smtp_from_name', e.target.value)}
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </FieldRow>
        </div>

        {/* Test email */}
        <div className="mt-4 flex items-center gap-3">
          <input
            type="email"
            placeholder="Test email recipient..."
            value={testEmailTo}
            onChange={(e) => setTestEmailTo(e.target.value)}
            className="text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
          <button
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending || !testEmailTo.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-300 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send test
          </button>
        </div>
      </section>
    </div>
  );
}
