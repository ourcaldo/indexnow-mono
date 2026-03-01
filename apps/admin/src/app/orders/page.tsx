'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminOrders } from '@/hooks';

function statusDot(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'pending': return 'bg-yellow-400';
    case 'proof_uploaded': return 'bg-blue-400';
    case 'failed': return 'bg-red-500';
    case 'cancelled': return 'bg-gray-400';
    default: return 'bg-gray-300';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'proof_uploaded': return 'Awaiting Confirmation';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatAmount(amount: unknown, currency: unknown) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  const cur = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(num);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');

  const { data, isLoading, isFetching, refetch } = useAdminOrders({
    page: currentPage,
    status: statusFilter,
    customer: customerSearch,
  });

  const orders = data?.orders ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const summaryItems = [
    { label: 'Total', value: summary?.total_orders ?? 0 },
    { label: 'Pending', value: summary?.pending_orders ?? 0 },
    { label: 'Awaiting', value: summary?.proof_uploaded_orders ?? 0 },
    { label: 'Completed', value: summary?.completed_orders ?? 0 },
    { label: 'Failed', value: summary?.failed_orders ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Payment transactions</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary row */}
      {summary && (
        <div className="flex items-center gap-6 text-sm">
          {summaryItems.map((item) => (
            <span key={item.label} className="text-gray-500 dark:text-gray-400">
              {item.label}: <span className="font-medium text-gray-900 dark:text-white tabular-nums">{item.value.toLocaleString()}</span>
            </span>
          ))}
          {typeof summary.total_revenue === 'number' && (
            <span className="text-gray-500 dark:text-gray-400 ml-auto">
              Revenue: <span className="font-medium text-gray-900 dark:text-white">{formatAmount(summary.total_revenue, 'USD')}</span>
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer…"
            value={customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#141520] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-[#141520] text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="proof_uploaded">Awaiting Confirmation</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading orders…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                      {order.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.user?.full_name || '—'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{order.user?.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {order.package?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatAmount(order.amount, order.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(order.status)}`} />
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 tabular-nums">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`); }}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {pagination.total_items.toLocaleString()} total orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.has_prev}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-gray-500">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={!pagination.has_next}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
