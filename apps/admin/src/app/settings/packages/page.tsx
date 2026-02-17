'use client'

import { useEffect, useState } from 'react'
import { 
  Package,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Star,
  Clock,
  Users,
  Zap,
  Search
} from 'lucide-react'
import { ADMIN_ENDPOINTS, logger } from '@indexnow/shared'
import { AdminPageSkeleton } from '@indexnow/ui'
import { ConfirmationDialog } from '@indexnow/ui/modals'
import { PackageForm } from './components/PackageForm'

import { Json } from '@indexnow/shared'

interface PricingTier {
  period: 'monthly' | 'quarterly' | 'biannual' | 'annual'
  period_label: string
  regular_price: number
  promo_price: number
  paddle_price_id?: string
}

interface PaymentPackage {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  billing_period: string
  features: string[]
  quota_limits: {
    concurrent_jobs?: number
    keywords_limit?: number
  }
  is_active: boolean
  is_popular?: boolean
  sort_order: number
  pricing_tiers?: PricingTier[]
  created_at: string
  updated_at: string
}

export default function PackageManagement() {
  const [packages, setPackages] = useState<PaymentPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPackage, setEditingPackage] = useState<PaymentPackage | null>(null)
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
    onConfirm: () => {},
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PACKAGES, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPackages(data.data?.packages || [])
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to fetch packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (packageData: Partial<PaymentPackage>) => {
    try {
      const url = packageData.id 
        ? ADMIN_ENDPOINTS.PACKAGE_BY_ID(packageData.id)
        : ADMIN_ENDPOINTS.PACKAGES
      
      const method = packageData.id ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(packageData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Package ${packageData.id ? 'updated' : 'created'} successfully!` })
        fetchPackages()
        setEditingPackage(null)
        setIsCreating(false)
      } else {
        setMessage({ type: 'error', text: 'Failed to save package' })
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to save package')
      setMessage({ type: 'error', text: 'Failed to save package' })
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Package',
      message: 'Are you sure you want to delete this package? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const response = await fetch(ADMIN_ENDPOINTS.PACKAGE_BY_ID(id), {
            method: 'DELETE',
            credentials: 'include'
          })

          if (response.ok) {
            setMessage({ type: 'success', text: 'Package deleted successfully!' })
            fetchPackages()
          } else {
            setMessage({ type: 'error', text: 'Failed to delete package' })
          }
        } catch (error) {
          logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to delete package')
          setMessage({ type: 'error', text: 'Failed to delete package' })
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Package Management</h1>
          <p className="text-muted-foreground mt-1">Manage subscription packages and pricing tiers</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Package</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg border ${
          message.type === 'success' 
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
        <PackageForm
          packageData={{}}
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Packages List */}
      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id}>
            {editingPackage?.id === pkg.id ? (
              <PackageForm
                packageData={editingPackage}
                onSave={handleSave}
                onCancel={() => setEditingPackage(null)}
              />
            ) : (
              <div className="bg-white rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                        {pkg.is_popular && (
                          <span className="px-2 py-1 text-xs font-medium bg-warning/10 text-warning rounded-full border border-warning/20 flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>Popular</span>
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          pkg.is_active 
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted/50 text-muted-foreground border-muted'
                        }`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Slug: {pkg.slug}</p>
                      
                      {/* Package Details */}
                      <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{pkg.quota_limits?.concurrent_jobs || 0} Concurrent Jobs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Search className="h-4 w-4 text-success" />
                          <span>{pkg.quota_limits?.keywords_limit === -1 ? 'Unlimited' : pkg.quota_limits?.keywords_limit || 0} Keywords</span>
                        </div>
                      </div>

                      {/* Features Preview */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground font-medium">Features:</p>
                          <p className="text-xs text-muted-foreground">{pkg.features.slice(0, 3).join(', ')}{pkg.features.length > 3 ? '...' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPackage(pkg)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
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

        {packages.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No packages configured</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-accent hover:underline"
            >
              Create your first package
            </button>
          </div>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  )
}
