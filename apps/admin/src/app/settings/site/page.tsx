'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { logger } from '@indexnow/shared';
import {
  useAdminSiteSettings,
  useSaveSiteSettings,
  useTestEmail,
  type UI_SiteSettings,
} from '@/hooks';

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#141520] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent';

function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
        {hint && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
          checked ? 'bg-gray-600 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition duration-200 ease-in-out mt-[3px] ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{children}</h2>
  );
}

export default function SiteSettings() {
  const { data: serverSettings, isLoading } = useAdminSiteSettings();
  const saveMutation = useSaveSiteSettings();
  const testEmailMutation = useTestEmail();

  const [settings, setSettings] = useState<UI_SiteSettings | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (serverSettings && !settings) setSettings(serverSettings);
  }, [serverSettings, settings]);

  const update = <K extends keyof UI_SiteSettings>(field: K, value: UI_SiteSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setMsg(null);
    try {
      await saveMutation.mutateAsync(settings);
      setMsg({ ok: true, text: 'Settings saved.' });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Failed to save site settings');
      setMsg({ ok: false, text: 'Failed to save settings.' });
    }
  };

  const handleTestEmail = async () => {
    if (!settings?.smtp_enabled) return;
    setMsg(null);
    try {
      await testEmailMutation.mutateAsync({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        smtp_from_name: settings.smtp_from_name,
        smtp_from_email: settings.smtp_from_email,
        smtp_secure: settings.smtp_secure,
      });
      setMsg({ ok: true, text: 'Test email sent.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to send test email.' });
    }
  };

  if (isLoading || !settings) {
    return <div className="py-20 text-center text-sm text-gray-400">{isLoading ? 'Loading...' : 'No settings found.'}</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Site Settings</h1>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white/10 text-white border border-gray-700 dark:border-white/10 rounded-md hover:bg-gray-800 dark:hover:bg-white/[0.15] transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-md border ${msg.ok ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          {msg.text}
        </div>
      )}

      {/* System settings */}
      <section>
        <SectionHeader>System settings</SectionHeader>
        <Toggle
          label="Maintenance mode"
          hint="Temporarily disable public access to the site"
          checked={settings.maintenance_mode}
          onChange={(v) => update('maintenance_mode', v)}
        />
        <Toggle
          label="User registration"
          hint="Allow new users to register accounts"
          checked={settings.registration_enabled}
          onChange={(v) => update('registration_enabled', v)}
        />
      </section>

      {/* Email / SMTP */}
      <section className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader>Email configuration</SectionHeader>
          <Toggle
            label=""
            checked={settings.smtp_enabled}
            onChange={(v) => update('smtp_enabled', v)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="SMTP host">
            <input type="text" value={settings.smtp_host || ''} onChange={(e) => update('smtp_host', e.target.value)} className={inputCls} placeholder="mail.example.com" />
          </Field>
          <Field label="SMTP port">
            <input type="number" value={settings.smtp_port || 465} onChange={(e) => update('smtp_port', parseInt(e.target.value))} className={inputCls} placeholder="465" />
          </Field>
          <Field label="SMTP username">
            <input type="text" value={settings.smtp_user || ''} onChange={(e) => update('smtp_user', e.target.value)} className={inputCls} placeholder="user@example.com" />
          </Field>
          <Field label="SMTP password">
            <input type="password" value={settings.smtp_pass || ''} onChange={(e) => update('smtp_pass', e.target.value)} className={inputCls} placeholder="••••••••••••" />
          </Field>
          <Field label="From name">
            <input type="text" value={settings.smtp_from_name || ''} onChange={(e) => update('smtp_from_name', e.target.value)} className={inputCls} placeholder="My Site" />
          </Field>
          <Field label="From email">
            <input type="email" value={settings.smtp_from_email || ''} onChange={(e) => update('smtp_from_email', e.target.value)} className={inputCls} placeholder="noreply@example.com" />
          </Field>
        </div>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Use TLS/SSL encryption"
            hint="Recommended for port 465"
            checked={settings.smtp_secure}
            onChange={(v) => update('smtp_secure', v)}
          />
          <div className="pt-2">
            <button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending || !settings.smtp_enabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testEmailMutation.isPending ? 'animate-spin' : ''}`} />
              {testEmailMutation.isPending ? 'Sending...' : 'Send test email'}
            </button>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Verify SMTP configuration is working</p>
          </div>
        </div>
      </section>
    </div>
  );
}