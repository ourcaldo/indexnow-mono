'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronLeft, ChevronRight, ShoppingCart, Clock, CheckCircle2 } from 'lucide-react';
import { useAdminOrders } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  expired: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

function MiniStat({ icon: Icon, iconBg, label, value }: { icon: React.ElementType; iconBg: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-bold text-gray-900 tabular-nums leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  useAdminPageViewLogger('orders', 'Orders List');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, isFetching, refetch } = useAdminOrders({ page, limit, status: statusFilter, customer: search || undefined });
  const orders = data?.orders ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;
  const totalItems = data?.pagination?.total_items ?? 0;
  const summary = data?.summary;

  return (
    <div className="bg-white min-h-full">
      {/* ─── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalItems.toLocaleString()} transactions</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── Summary mini stats ──────────────────────────── */}
      <div className="px-8 py-5 border-b border-gray-200 grid grid-cols-3 gap-4">
        <MiniStat icon={ShoppingCart} iconBg="bg-blue-50 text-blue-600" label="Total Orders" value={totalItems} />
        <MiniStat icon={Clock} iconBg="bg-amber-50 text-amber-600" label="Pending" value={summary?.pending_orders ?? 0} />
        <MiniStat icon={CheckCircle2} iconBg="bg-emerald-50 text-emerald-600" label="Completed" value={summary?.completed_orders ?? (data?.orders?.filter((o: any) => o.transaction_status === 'completed').length ?? 0)} />
      </div>

      {/* ─── Filter bar ──────────────────────────────────── */}
      <div className="px-8 py-3 border-b border-gray-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search customer..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="pending_payment">Pending payment</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ─── Table ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="px-8 py-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-8 pr-3 py-3 w-10">#</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Order ID</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Customer</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Package</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Amount</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-3 pr-8 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, index: number) => (
                  <tr key={order.id} onClick={() => router.push(`/orders/${order.id}`)} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors">
                    <td className="pl-8 pr-3 py-3.5 text-center text-xs text-gray-400 tabular-nums">{(page - 1) * limit + index + 1}</td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-medium text-blue-600 tabular-nums">{order.order_id || order.transaction_id || order.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="text-sm font-medium text-gray-900 truncate">{order.user?.full_name || order.user?.email || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 truncate">{order.user?.email}</div>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-600">{order.package?.name || '\u2014'}</td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-gray-900 tabular-nums">{order.currency?.toUpperCase()} {Number(order.amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${STATUS_STYLES[order.transaction_status] ?? STATUS_STYLES.cancelled}`}>
                        {(order.transaction_status ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="pl-3 pr-8 py-3.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-sm text-gray-400">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 tabular-nums">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
