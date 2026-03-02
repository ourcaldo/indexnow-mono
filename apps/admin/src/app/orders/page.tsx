'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminOrders } from '@/hooks';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-400',
  approved: 'bg-emerald-400',
  pending: 'bg-amber-400',
  pending_payment: 'bg-amber-400',
  rejected: 'bg-red-400',
  cancelled: 'bg-gray-500',
  expired: 'bg-gray-500',
};

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, isFetching, refetch } = useAdminOrders({
    page,
    limit,
    status: statusFilter,
    customer: search || undefined,
  });

  const orders = data?.orders ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalItems = data?.pagination?.total_items ?? 0;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Orders</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {totalItems.toLocaleString()} total
            {summary?.pending_orders ? ` · ${summary.pending_orders} pending` : ''}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-400 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-gray-200 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-300 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="pending_payment">Pending payment</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_100px_90px_110px] gap-4 px-3 py-2 text-[11px] text-gray-600 uppercase tracking-wide">
            <span>Customer</span>
            <span>Package</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {/* Rows */}
          <div className="border-t border-white/[0.04]">
            {orders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="grid grid-cols-[1fr_140px_100px_90px_110px] gap-4 px-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13px] text-gray-200 font-medium truncate">
                    {order.user?.full_name || order.user?.email || 'Unknown'}
                  </div>
                  <div className="text-[12px] text-gray-600 truncate">
                    {order.user?.email}
                  </div>
                </div>
                <div className="flex items-center text-[13px] text-gray-400 truncate">
                  {order.package?.name || '—'}
                </div>
                <div className="flex items-center text-[13px] text-white font-medium tabular-nums">
                  {order.currency?.toUpperCase()} {Number(order.amount ?? 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[order.transaction_status] ?? 'bg-gray-500'}`}
                  />
                  <span className="text-[12px] text-gray-400">
                    {(order.transaction_status ?? '').replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center text-[12px] text-gray-600 tabular-nums">
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-600">No orders found</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04]">
              <span className="text-[12px] text-gray-600">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
