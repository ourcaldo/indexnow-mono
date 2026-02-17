'use client'

import { useEffect, useState } from 'react'
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
  Map
} from 'lucide-react'
import { ADMIN_ENDPOINTS, SiteSettingsRow, logger } from '@indexnow/shared'
import { SettingsPageSkeleton, ErrorState } from '@indexnow/ui'

type UI_SiteSettings = SiteSettingsRow & {
  robots_txt_content?: string
  site_tagline?: string | null
  white_logo?: string | null
}

export default function SiteSettings() {
  const [settings, setSettings] = useState<UI_SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSiteSettings()
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.SITE_SETTINGS, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.data?.settings)
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to fetch site settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(ADMIN_ENDPOINTS.SITE_SETTINGS, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Site settings saved successfully!' })
        fetchSiteSettings() // Refresh data
      } else {
        setMessage({ type: 'error', text: 'Failed to save site settings' })
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to save site settings')
      setMessage({ type: 'error', text: 'Failed to save site settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = <K extends keyof UI_SiteSettings>(field: K, value: UI_SiteSettings[K]) => {
    if (!settings) return
    setSettings({
      ...settings,
      [field]: value
    })
  }

  const handleTestEmail = async () => {
    if (!settings || !settings.smtp_enabled) return

    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch(ADMIN_ENDPOINTS.TEST_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_pass: settings.smtp_pass,
          smtp_from_name: settings.smtp_from_name,
          smtp_from_email: settings.smtp_from_email,
          smtp_secure: settings.smtp_secure
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully!' })
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Failed to send test email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <SettingsPageSkeleton />
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <ErrorState
          title="Failed to load site settings"
          message="Site settings could not be loaded. Please try refreshing the page."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your site's basic information and appearance</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg border ${message.type === 'success'
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => updateSettings('site_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="IndexNow Studio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => updateSettings('contact_email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="contact@indexnowpro.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Tagline
            </label>
            <input
              type="text"
              value={settings.site_tagline || ''}
              onChange={(e) => updateSettings('site_tagline', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Rank Tracking Made Simple for Smarter SEO Decisions"
            />
            <p className="text-xs text-muted-foreground mt-1">Short tagline that appears in page titles and branding</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Description
            </label>
            <textarea
              value={settings.site_description || ''}
              onChange={(e) => updateSettings('site_description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Professional URL indexing automation platform"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => updateSettings('support_email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="support@indexnowpro.com"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Image className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Branding & Assets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Logo URL
            </label>
            <input
              type="url"
              value={settings.site_logo_url || ''}
              onChange={(e) => updateSettings('site_logo_url', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground mt-1">Main logo for header and branding</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              White Logo URL
            </label>
            <input
              type="url"
              value={settings.white_logo || ''}
              onChange={(e) => updateSettings('white_logo', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/white-logo.png"
            />
            <p className="text-xs text-muted-foreground mt-1">White version for dark backgrounds</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Icon URL
            </label>
            <input
              type="url"
              value={settings.site_icon_url || ''}
              onChange={(e) => updateSettings('site_icon_url', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/icon.png"
            />
            <p className="text-xs text-muted-foreground mt-1">Square icon for mobile and apps</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Favicon URL
            </label>
            <input
              type="url"
              value={settings.site_favicon_url || ''}
              onChange={(e) => updateSettings('site_favicon_url', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/favicon.ico"
            />
            <p className="text-xs text-muted-foreground mt-1">Browser tab icon (16x16 or 32x32)</p>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">System Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-foreground">Maintenance Mode</h3>
              <p className="text-xs text-muted-foreground">Temporarily disable public access to the site</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => updateSettings('maintenance_mode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-foreground">User Registration</h3>
              <p className="text-xs text-muted-foreground">Allow new users to register accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registration_enabled}
                onChange={(e) => updateSettings('registration_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SEO Management */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Search className="h-5 w-5 text-success" />
          <h2 className="text-lg font-semibold text-foreground">SEO Management</h2>
        </div>

        {/* Robots.txt Section */}
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-md font-medium text-foreground">Robots.txt Configuration</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Robots.txt Content
              </label>
              <textarea
                value={settings.robots_txt_content || ''}
                onChange={(e) => updateSettings('robots_txt_content', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
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
              <p className="text-xs text-muted-foreground mt-1">
                Configure how search engines crawl your site. Changes are cached for 1 hour.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Email Configuration */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Email Configuration</h2>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.smtp_enabled}
              onChange={(e) => updateSettings('smtp_enabled', e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.smtp_enabled ? 'bg-success' : 'bg-muted'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${settings.smtp_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </div>
            <span className="ml-2 text-sm text-muted-foreground">
              {settings.smtp_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="space-y-6">
          {/* Server Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Server className="h-4 w-4 inline mr-2" />
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtp_host || ''}
                onChange={(e) => updateSettings('smtp_host', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="mail.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <SettingsIcon className="h-4 w-4 inline mr-2" />
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.smtp_port || 465}
                onChange={(e) => updateSettings('smtp_port', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="465"
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                SMTP Username
              </label>
              <input
                type="text"
                value={settings.smtp_user || ''}
                onChange={(e) => updateSettings('smtp_user', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="username@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                SMTP Password
              </label>
              <input
                type="password"
                value={settings.smtp_pass || ''}
                onChange={(e) => updateSettings('smtp_pass', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Sender Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Name
              </label>
              <input
                type="text"
                value={settings.smtp_from_name || 'IndexNow Studio'}
                onChange={(e) => updateSettings('smtp_from_name', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="IndexNow Studio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Email Address
              </label>
              <input
                type="email"
                value={settings.smtp_from_email || ''}
                onChange={(e) => updateSettings('smtp_from_email', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="noreply@example.com"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => updateSettings('smtp_secure', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.smtp_secure ? 'bg-success' : 'bg-muted'
                }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${settings.smtp_secure ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </div>
              <span className="ml-3 text-sm text-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                Use TLS/SSL Encryption
              </span>
            </label>
            <p className="text-xs text-muted-foreground ml-14 mt-1">
              Recommended for secure email transmission (typically required for port 465)
            </p>
          </div>

          {/* Test Email */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleTestEmail}
              disabled={testing || !settings.smtp_enabled}
              className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube2 className="h-4 w-4" />
              <span>{testing ? 'Testing...' : 'Test Email Configuration'}</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              Send a test email to verify SMTP configuration is working correctly
            </p>
          </div>
        </div>
      </div>
    </div >
  )
}
