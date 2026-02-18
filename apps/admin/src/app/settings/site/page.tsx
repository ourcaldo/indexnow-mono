'use client';

import { useEffect, useState } from 'react';
import {
  Globe,
  Save,
  Upload,
  Image,
  Mail,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle,
  Server,
  Lock,
  Shield,
  TestTube2,
  Search,
  FileText,
  Map,
} from 'lucide-react';
import { SettingsPageSkeleton, ErrorState } from '@indexnow/ui';
import {
  useAdminSiteSettings,
  useSaveSiteSettings,
  useTestEmail,
  type UI_SiteSettings,
} from '@/hooks';

export default function SiteSettings() {
  const { data: serverSettings, isLoading: loading } = useAdminSiteSettings();
  const saveMutation = useSaveSiteSettings();
  const testEmailMutation = useTestEmail();

  const [settings, setSettings] = useState<UI_SiteSettings | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync server data to local form state
  useEffect(() => {
    if (serverSettings && !settings) {
      setSettings(serverSettings);
    }
  }, [serverSettings, settings]);

  const handleSave = async () => {
    if (!settings) return;
    setMessage(null);

    try {
      await saveMutation.mutateAsync(settings);
      setMessage({ type: 'success', text: 'Site settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save site settings' });
    }
  };

  const updateSettings = <K extends keyof UI_SiteSettings>(field: K, value: UI_SiteSettings[K]) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleTestEmail = async () => {
    if (!settings || !settings.smtp_enabled) return;
    setMessage(null);

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
      setMessage({ type: 'success', text: 'Test email sent successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Network error. Please try again.',
      });
    }
  };

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  if (!settings) {
    return (
      <div className="py-12 text-center">
        <ErrorState
          title="Failed to load site settings"
          message="Site settings could not be loaded. Please try refreshing the page."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your site's basic information and appearance
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-primary hover:bg-primary/90 flex items-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
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

      {/* Basic Information */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center space-x-2">
          <Globe className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Site Name</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => updateSettings('site_name', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="IndexNow Studio"
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Contact Email</label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => updateSettings('contact_email', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="contact@indexnowpro.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-foreground mb-2 block text-sm font-medium">Site Tagline</label>
            <input
              type="text"
              value={settings.site_tagline || ''}
              onChange={(e) => updateSettings('site_tagline', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="Rank Tracking Made Simple for Smarter SEO Decisions"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Short tagline that appears in page titles and branding
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-foreground mb-2 block text-sm font-medium">
              Site Description
            </label>
            <textarea
              value={settings.site_description || ''}
              onChange={(e) => updateSettings('site_description', e.target.value)}
              rows={3}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="Professional URL indexing automation platform"
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Support Email</label>
            <input
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => updateSettings('support_email', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="support@indexnowpro.com"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center space-x-2">
          <Image className="text-warning h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Branding & Assets</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Site Logo URL</label>
            <input
              type="url"
              value={settings.site_logo_url || ''}
              onChange={(e) => updateSettings('site_logo_url', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-muted-foreground mt-1 text-xs">Main logo for header and branding</p>
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">White Logo URL</label>
            <input
              type="url"
              value={settings.white_logo || ''}
              onChange={(e) => updateSettings('white_logo', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="https://example.com/white-logo.png"
            />
            <p className="text-muted-foreground mt-1 text-xs">White version for dark backgrounds</p>
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Site Icon URL</label>
            <input
              type="url"
              value={settings.site_icon_url || ''}
              onChange={(e) => updateSettings('site_icon_url', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="https://example.com/icon.png"
            />
            <p className="text-muted-foreground mt-1 text-xs">Square icon for mobile and apps</p>
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Favicon URL</label>
            <input
              type="url"
              value={settings.site_favicon_url || ''}
              onChange={(e) => updateSettings('site_favicon_url', e.target.value)}
              className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
              placeholder="https://example.com/favicon.ico"
            />
            <p className="text-muted-foreground mt-1 text-xs">Browser tab icon (16x16 or 32x32)</p>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center space-x-2">
          <SettingsIcon className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">System Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-secondary flex items-center justify-between rounded-lg p-4">
            <div>
              <h3 className="text-foreground text-sm font-medium">Maintenance Mode</h3>
              <p className="text-muted-foreground text-xs">
                Temporarily disable public access to the site
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => updateSettings('maintenance_mode', e.target.checked)}
                className="peer sr-only"
              />
              <div className="bg-muted peer-focus:ring-primary/20 peer after:bg-card after:border-border peer-checked:bg-primary h-6 w-11 rounded-full peer-focus:ring-4 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="bg-secondary flex items-center justify-between rounded-lg p-4">
            <div>
              <h3 className="text-foreground text-sm font-medium">User Registration</h3>
              <p className="text-muted-foreground text-xs">Allow new users to register accounts</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.registration_enabled}
                onChange={(e) => updateSettings('registration_enabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="bg-muted peer-focus:ring-primary/20 peer after:bg-card after:border-border peer-checked:bg-primary h-6 w-11 rounded-full peer-focus:ring-4 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SEO Management */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center space-x-2">
          <Search className="text-success h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">SEO Management</h2>
        </div>

        {/* Robots.txt Section */}
        <div className="space-y-6">
          <div className="border-border rounded-lg border p-4">
            <div className="mb-4 flex items-center space-x-2">
              <FileText className="text-primary h-4 w-4" />
              <h3 className="text-md text-foreground font-medium">Robots.txt Configuration</h3>
            </div>
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Robots.txt Content
              </label>
              <textarea
                value={settings.robots_txt_content || ''}
                onChange={(e) => updateSettings('robots_txt_content', e.target.value)}
                rows={12}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-transparent focus:ring-2"
                placeholder={`User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /backend/

# Allow important directories
Allow: /pricing/
Allow: /contact/

# Crawl delay
Crawl-delay: 1`}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Configure how search engines crawl your site. Changes are cached for 1 hour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Email Configuration */}
      <div className="bg-card border-border rounded-lg border p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="text-primary h-5 w-5" />
            <h2 className="text-foreground text-lg font-semibold">Email Configuration</h2>
          </div>
          <label className="flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.smtp_enabled}
              onChange={(e) => updateSettings('smtp_enabled', e.target.checked)}
              className="sr-only"
            />
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smtp_enabled ? 'bg-success' : 'bg-muted'
              }`}
            >
              <span
                className={`bg-card inline-block h-4 w-4 transform rounded-full transition-transform ${
                  settings.smtp_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-muted-foreground ml-2 text-sm">
              {settings.smtp_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="space-y-6">
          {/* Server Settings */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                <Server className="mr-2 inline h-4 w-4" />
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtp_host || ''}
                onChange={(e) => updateSettings('smtp_host', e.target.value)}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="mail.example.com"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                <SettingsIcon className="mr-2 inline h-4 w-4" />
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.smtp_port || 465}
                onChange={(e) => updateSettings('smtp_port', parseInt(e.target.value))}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="465"
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                <Mail className="mr-2 inline h-4 w-4" />
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.smtp_user || ''}
                onChange={(e) => updateSettings('smtp_user', e.target.value)}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="username@example.com"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                <Lock className="mr-2 inline h-4 w-4" />
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.smtp_pass || ''}
                onChange={(e) => updateSettings('smtp_pass', e.target.value)}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Sender Settings */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">From Name</label>
              <input
                type="text"
                value={settings.smtp_from_name || 'IndexNow Studio'}
                onChange={(e) => updateSettings('smtp_from_name', e.target.value)}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="IndexNow Studio"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                From Email Address
              </label>
              <input
                type="email"
                value={settings.smtp_from_email || ''}
                onChange={(e) => updateSettings('smtp_from_email', e.target.value)}
                className="border-border focus:ring-primary w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
                placeholder="noreply@example.com"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => updateSettings('smtp_secure', e.target.checked)}
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.smtp_secure ? 'bg-success' : 'bg-muted'
                }`}
              >
                <span
                  className={`bg-card inline-block h-4 w-4 transform rounded-full transition-transform ${
                    settings.smtp_secure ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-foreground ml-3 text-sm">
                <Shield className="mr-1 inline h-4 w-4" />
                Use TLS/SSL Encryption
              </span>
            </label>
            <p className="text-muted-foreground mt-1 ml-14 text-xs">
              Recommended for secure email transmission (typically required for port 465)
            </p>
          </div>

          {/* Test Email */}
          <div className="border-border border-t pt-4">
            <button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending || !settings.smtp_enabled}
              className="border-border hover:bg-secondary flex items-center space-x-2 rounded-lg border px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TestTube2 className="h-4 w-4" />
              <span>{testEmailMutation.isPending ? 'Testing...' : 'Test Email Configuration'}</span>
            </button>
            <p className="text-muted-foreground mt-1 text-xs">
              Send a test email to verify SMTP configuration is working correctly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
