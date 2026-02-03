'use client'

import { useState, useEffect } from 'react'
import { 
  Filter, 
  Search, 
  Calendar, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { authService, BILLING_ENDPOINTS, formatCurrency, formatDate } from '@indexnow/shared'
import { supabaseBrowser as supabase } from '@indexnow/database'
import { LoadingSpinner, BillingHistory, useApiError } from '@indexnow/ui'

interface Transaction {
  id: string
  transaction_type: string
  transaction_status: string
  amount: number
  currency: string
  payment_method: string
  gateway_transaction_id: string
  created_at: string
  processed_at: string | null
  verified_at: string | null
  notes: string | null
  package: {
    name: string
    slug: string
  }
  gateway: {
    name: string
    slug: string
  }
  subscription: {
    billing_period: string
    started_at: string
    expires_at: string
  } | null
}

interface BillingHistoryData {
  transactions: Transaction[]
  summary: {
    total_transactions: number
    completed_transactions: number
    pending_transactions: number
    failed_transactions: number
    total_amount_spent: number
  }
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
    has_next: boolean
    has_prev: boolean
  }
}

export default function BillingHistoryPage() {
  const { handleApiError } = useApiError()
  const [historyData, setHistoryData] = useState<BillingHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    loadBillingHistory()
  }, [currentPage, statusFilter, typeFilter])

  const loadBillingHistory = async () => {
    try {
      setLoading(true)
      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) {
        throw new Error('No authentication token')
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`${BILLING_ENDPOINTS.HISTORY}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load billing history')
      }

      const result = await response.json()
      // API returns: { success: true, data: { transactions: [...], summary: {...}, pagination: {...} } }
      const data = result?.success === true && result.data ? result.data : result
      setHistoryData(data)
    } catch (error) {
      handleApiError(error, { context: 'BillingHistory', toastTitle: 'Load Error' })
      setError(error instanceof Error ? error.message : 'Failed to load billing history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />
      case 'pending': return <Clock className="h-4 w-4 text-warning" />
      case 'proof_uploaded': return <Clock className="h-4 w-4 text-warning" />
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
      case 'pending': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' }
      case 'proof_uploaded': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' }
      case 'failed': return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' }
      case 'cancelled': return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' }
      default: return { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' }
    }
  }

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'subscription': return 'New Subscription'
      case 'renewal': return 'Renewal'
      case 'upgrade': return 'Plan Upgrade'
      case 'downgrade': return 'Plan Downgrade'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const filteredTransactions = historyData?.transactions.filter(transaction => {
    if (!searchTerm) return true
    return (
      transaction.package.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading History</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadBillingHistory}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BillingHistory 
        historyData={historyData}
        currentPage={currentPage}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        searchTerm={searchTerm}
        setCurrentPage={setCurrentPage}
        setStatusFilter={setStatusFilter}
        setTypeFilter={setTypeFilter}
        setSearchTerm={setSearchTerm}
        handlePageChange={setCurrentPage}
        resetFilters={() => {
          setStatusFilter('')
          setTypeFilter('')
          setSearchTerm('')
          setCurrentPage(1)
        }}
        getStatusIcon={getStatusIcon}
        getStatusText={(status: string) => status.replace('_', ' ').toUpperCase()}
        getStatusColor={getStatusColor}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onRowClick={(id: string) => window.location.href = `/dashboard/settings/plans-billing/order/${id}`}
      />
    </div>
  )
}
