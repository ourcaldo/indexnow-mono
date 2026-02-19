'use client';

import { useState, useEffect } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import { authService, authenticatedFetch } from '@indexnow/supabase-client';
import { BILLING_ENDPOINTS, formatCurrency, formatDate } from '@indexnow/shared';
import { LoadingSpinner, useApiError, ErrorState } from '@indexnow/ui';
import {
  BillingHistory,
  getTransactionStatusColors,
  formatTransactionType,
  type Transaction,
  type BillingHistoryData,
} from '@indexnow/ui/billing';

export default function BillingHistoryPage() {
  const { handleApiError } = useApiError();
  const [historyData, setHistoryData] = useState<BillingHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadBillingHistory();
    // (#V7 M-32) loadBillingHistory depends on state setters which are stable.
    // Listing it would cause infinite re-renders because it's not memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, typeFilter]);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await authenticatedFetch(`${BILLING_ENDPOINTS.HISTORY}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load billing history');
      }

      const result = await response.json();
      // API returns: { success: true, data: { transactions: [...], summary: {...}, pagination: {...} } }
      const data = result?.success === true && result.data ? result.data : result;
      setHistoryData(data);
    } catch (error) {
      handleApiError(error, { context: 'BillingHistory', toastTitle: 'Load Error' });
      setError(error instanceof Error ? error.message : 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-success h-4 w-4" />;
      case 'pending':
        return <Clock className="text-warning h-4 w-4" />;
      case 'proof_uploaded':
        return <Clock className="text-warning h-4 w-4" />;
      case 'failed':
        return <XCircle className="text-destructive h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="text-muted-foreground h-4 w-4" />;
      default:
        return <AlertCircle className="text-muted-foreground h-4 w-4" />;
    }
  };

  const getStatusColor = getTransactionStatusColors;

  const filteredTransactions =
    historyData?.transactions.filter((transaction) => {
      if (!searchTerm) return true;
      return (
        transaction.package?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.gateway_transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <ErrorState title="Error Loading History" message={error} onRetry={loadBillingHistory} />
      </div>
    );
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
          setStatusFilter('');
          setTypeFilter('');
          setSearchTerm('');
          setCurrentPage(1);
        }}
        getStatusIcon={getStatusIcon}
        getStatusText={(status: string) => status.replace('_', ' ').toUpperCase()}
        getStatusColor={getStatusColor}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onRowClick={(id: string) =>
          (window.location.href = `/dashboard/settings/plans-billing/order/${id}`)
        }
      />
    </div>
  );
}
