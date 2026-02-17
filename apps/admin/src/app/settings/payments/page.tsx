'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  X
} from 'lucide-react'
import { ADMIN_ENDPOINTS,
  PaymentGatewayRow,
  PaymentGatewayConfiguration,
  PaymentGatewayCredentials, logger } from '@indexnow/shared'
import { AdminPageSkeleton } from '@indexnow/ui'
import { ConfirmationDialog } from '@indexnow/ui/modals'

// Strict type helper for UI state
type UI_PaymentGateway = Omit<PaymentGatewayRow, 'configuration' | 'api_credentials'> & {
  configuration: PaymentGatewayConfiguration
  api_credentials: PaymentGatewayCredentials
}

export default function PaymentGateways() {
  const [gateways, setGateways] = useState<UI_PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGateway, setEditingGateway] = useState<UI_PaymentGateway | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
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
    onConfirm: () => { },
  })

  useEffect(() => {
    fetchPaymentGateways()
  }, [])

  const fetchPaymentGateways = async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAYS, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Ensure configuration and api_credentials are objects
        const sanitizedGateways = (data.data?.gateways || []).map((g: PaymentGatewayRow) => ({
          ...g,
          configuration: (g.configuration as PaymentGatewayConfiguration) || {},
          api_credentials: (g.api_credentials as PaymentGatewayCredentials) || {}
        }))
        setGateways(sanitizedGateways)
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to fetch payment gateways')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (gateway: Partial<UI_PaymentGateway>) => {
    try {
      const url = gateway.id
        ? ADMIN_ENDPOINTS.PAYMENT_GATEWAY_BY_ID(gateway.id)
        : ADMIN_ENDPOINTS.PAYMENT_GATEWAYS

      const method = gateway.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(gateway),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Payment gateway ${gateway.id ? 'updated' : 'created'} successfully!` })
        fetchPaymentGateways()
        setEditingGateway(null)
        setIsCreating(false)
      } else {
        setMessage({ type: 'error', text: 'Failed to save payment gateway' })
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to save payment gateway')
      setMessage({ type: 'error', text: 'Failed to save payment gateway' })
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Gateway',
      message: 'Are you sure you want to delete this payment gateway? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const response = await fetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_BY_ID(id), {
            method: 'DELETE',
            credentials: 'include'
          })

          if (response.ok) {
            setMessage({ type: 'success', text: 'Payment gateway deleted successfully!' })
            fetchPaymentGateways()
          } else {
            setMessage({ type: 'error', text: 'Failed to delete payment gateway' })
          }
        } catch (error) {
          logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to delete payment gateway')
          setMessage({ type: 'error', text: 'Failed to delete payment gateway' })
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PAYMENT_GATEWAY_DEFAULT(id), {
        method: 'PATCH',
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Default payment gateway updated!' })
        fetchPaymentGateways()
      } else {
        setMessage({ type: 'error', text: 'Failed to update default gateway' })
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to update default gateway')
      setMessage({ type: 'error', text: 'Failed to update default gateway' })
    }
  }

  const GatewayForm = ({ gateway, onSave, onCancel }: {
    gateway: Partial<UI_PaymentGateway>
    onSave: (gateway: Partial<UI_PaymentGateway>) => void
    onCancel: () => void
  }) => {
    // Initialize defaults if undefined
    const [formData, setFormData] = useState<Partial<UI_PaymentGateway>>({
      ...gateway,
      configuration: gateway.configuration || {},
      api_credentials: gateway.api_credentials || {}
    })

    const updateField = <K extends keyof UI_PaymentGateway>(field: K, value: UI_PaymentGateway[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateConfigurationField = <K extends keyof PaymentGatewayConfiguration>(
      field: K,
      value: PaymentGatewayConfiguration[K]
    ) => {
      setFormData(prev => ({
        ...prev,
        configuration: {
          ...(prev.configuration || {}),
          [field]: value
        }
      }))
    }

    const updateCredentialsField = <K extends keyof PaymentGatewayCredentials>(
      field: K,
      value: PaymentGatewayCredentials[K]
    ) => {
      setFormData(prev => ({
        ...prev,
        api_credentials: {
          ...(prev.api_credentials || {}),
          [field]: value
        }
      }))
    }

    return (
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="PayPal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="paypal"
            />
          </div>

          {/* Paddle Configuration */}
          {formData.slug === 'paddle' && (
            <>
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-foreground mb-4 border-b border-border pb-2">
                  Paddle Billing API Configuration
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your Paddle credentials for subscription billing and payments. Paddle handles all payment methods, tax calculation, and compliance globally.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Environment</label>
                <select
                  value={formData.configuration?.environment || 'sandbox'}
                  onChange={(e) => updateConfigurationField('environment', e.target.value as 'sandbox' | 'production')}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vendor ID</label>
                <input
                  type="text"
                  value={String(formData.configuration?.vendor_id || '')}
                  onChange={(e) => updateConfigurationField('vendor_id', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="12345"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Paddle Vendor ID from Settings → Authentication
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.api_credentials?.api_key || ''}
                  onChange={(e) => updateCredentialsField('api_key', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="paddle_api_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API key will be encrypted before storing in database. Recommended: Store in environment variables (PADDLE_API_KEY).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Webhook Secret</label>
                <input
                  type="password"
                  value={formData.api_credentials?.webhook_secret || ''}
                  onChange={(e) => updateCredentialsField('webhook_secret', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="pdl_ntfset_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Webhook secret for verifying event signatures. Recommended: Store in environment variables (PADDLE_WEBHOOK_SECRET).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Client Token</label>
                <input
                  type="text"
                  value={formData.api_credentials?.client_token || ''}
                  onChange={(e) => updateCredentialsField('client_token', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="test_... or live_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Client-side token for Paddle.js initialization. This is safe to expose in the browser and will be served via the config API.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={String(formData.configuration?.webhook_url || '')}
                  onChange={(e) => updateConfigurationField('webhook_url', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="https://yourdomain.com/api/paddle/webhook"
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This webhook URL should be configured in your Paddle dashboard under Developer Tools → Notifications
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
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span className="ml-2 text-sm text-foreground">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default || false}
                onChange={(e) => updateField('is_default', e.target.checked)}
                className="rounded border-border text-accent focus:border-transparent"
              />
              <span className="ml-2 text-sm text-foreground">Default</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Gateways</h1>
          <p className="text-muted-foreground mt-1">Manage payment methods and processing options</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Gateway</span>
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

      {/* Create Form */}
      {isCreating && (
        <GatewayForm
          gateway={{}}
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
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
              <div className="bg-white rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-foreground">{gateway.name}</h3>
                        {gateway.is_default && (
                          <span className="px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full border border-success/20">
                            Default
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${gateway.is_active
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted/10 text-muted-foreground border-muted/20'
                          }`}>
                          {gateway.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Slug: {gateway.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!gateway.is_default && (
                      <button
                        onClick={() => handleSetDefault(gateway.id)}
                        className="px-3 py-1 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setEditingGateway(gateway)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(gateway.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No payment gateways configured</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 text-accent hover:underline"
          >
            Add your first payment gateway
          </button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  )
}
