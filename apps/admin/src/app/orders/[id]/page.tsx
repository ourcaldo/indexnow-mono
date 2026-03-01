'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, XCircle, Mail, ExternalLink, Download } from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime, logger, type Json } from '@indexnow/shared';
import { fromJson } from '@indexnow/database/client';
import { OrderActivityTimeline } from './components/OrderActivityTimeline';
import { useAdminOrderDetail, useUpdateOrderStatus } from '@/hooks';

interface OrderMetadata {
  customer_info?: { first_name: string; last_name: string; email: string; phone_number: string };
  billing_period?: string;
  billing_address?: Record<string, unknown>;
}

function statusLabel(s: string) {
  if (s === 'pending') return { text: 'Pending', cls: 'text-gray-500 dark:text-gray-400' };
  if (s === 'proof_uploaded') return { text: 'Awaiting confirmation', cls: 'text-yellow-600 dark:text-yellow-400' };
  if (s === 'completed') return { text: 'Completed', cls: 'text-green-600 dark:text-green-400' };
  if (s === 'failed') return { text: 'Failed', cls: 'text-red-600 dark:text-red-400' };
  return { text: s, cls: 'text-gray-500' };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <div className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value}</div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<'completed' | 'failed' | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const { data: orderData, isLoading, error, refetch } = useAdminOrderDetail(orderId);
  const statusMutation = useUpdateOrderStatus(orderId);

  const handleStatusUpdate = async () => {
    if (!statusAction || !orderData) return;
    try {
      const result = await statusMutation.mutateAsync({ status: statusAction, notes: statusNotes });
      setMsg({ ok: true, text: result.message || 'Status updated.' });
      setStatusModalOpen(false);
      setStatusAction(null);
      setStatusNotes('');
    } catch (err) {
      logger.error({ error: err instanceof Error ? err : undefined }, 'Failed to update order status');
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update status.' });
    }
  };

  if (isLoading) return <div className="py-20 text-center text-sm text-gray-400">Loading order…</div>;
  if (error) return (
    <div className="py-20 text-center space-y-2">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Error Loading Order</p>
      <p className="text-xs text-gray-400">{error.message}</p>
      <button onClick={() => refetch()} className="text-xs underline text-gray-400">Retry</button>
    </div>
  );
  if (!orderData) return null;

  const { order, activity_history, transaction_history } = orderData;
  const metadata = fromJson<OrderMetadata>(order.metadata);
  const features = fromJson<(string | { name: string })[]>(order.package?.features) || [];
  const canUpdateStatus = ['proof_uploaded', 'pending'].includes(order.transaction_status);
  const status = statusLabel(order.transaction_status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</h1>
            <span className={`text-sm ${status.cls}`}>{status.text}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          {formatCurrency(order.amount, order.currency)}
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-md border ${msg.ok ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          {msg.text}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Order Details */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Order details</p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Order ID" value={<span className="font-mono text-xs break-all">{order.id}</span>} />
              <Row label="Amount" value={<span className="font-semibold">{formatCurrency(order.amount, order.currency)}</span>} />
              <Row label="Created" value={formatDate(order.created_at)} />
              <Row label="Last updated" value={formatRelativeTime(order.updated_at)} />
              {order.verified_at && (
                <Row label="Verified" value={`${formatDate(order.verified_at)}${order.verifier ? ` by ${order.verifier.full_name}` : ''}`} />
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Customer</p>
            <div className="space-y-3">
              <Row label="Name" value={order.user.full_name} />
              <Row label="Email" value={
                <span className="flex items-center gap-1.5">
                  {order.user.email}
                  <button onClick={() => window.open(`mailto:${order.user.email}`, '_blank')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                </span>
              } />
              {metadata?.customer_info?.phone_number && (
                <Row label="Phone" value={metadata.customer_info.phone_number} />
              )}
              <Row label="Registered" value={formatDate(order.user.created_at)} />
              <Row label="Subscription" value={order.user.expires_at ? `Active until ${formatDate(order.user.expires_at)}` : 'No active subscription'} />
            </div>
          </div>

          {/* Package Details */}
          {order.package && (
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Package</p>
              <div className="space-y-3">
                <Row label="Name" value={order.package.name} />
                <Row label="Billing period" value={metadata?.billing_period || order.package.billing_period} />
                {order.package.description && (
                  <Row label="Description" value={<span className="text-xs">{order.package.description}</span>} />
                )}
                {features.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Features</p>
                    <ul className="space-y-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {typeof f === 'string' ? f : f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <OrderActivityTimeline transactionHistory={transaction_history} activityHistory={activity_history} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Admin Actions */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Admin actions</p>
            {canUpdateStatus && (
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => { setStatusAction('completed'); setStatusModalOpen(true); }}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve payment
                </button>
                <button
                  onClick={() => { setStatusAction('failed'); setStatusModalOpen(true); }}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject payment
                </button>
              </div>
            )}
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => window.open(`mailto:${order.user.email}`, '_blank')} className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Email customer
              </button>
              <button onClick={() => router.push(`/users?search=${order.user.email}`)} className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                View user profile
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Payment</p>
            <div className="space-y-3">
              <Row label="Gateway" value={order.gateway?.name || 'Unknown'} />
              {order.payment_method && <Row label="Method" value={order.payment_method} />}
              <Row label="Reference" value={<span className="font-mono text-xs">{order.id}</span>} />
              {order.gateway_transaction_id && (
                <Row label="Gateway TX ID" value={<span className="font-mono text-xs break-all">{order.gateway_transaction_id}</span>} />
              )}
            </div>
          </div>

          {/* Payment Proof */}
          {order.payment_proof_url && (
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment proof</p>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md overflow-hidden mb-3">
                <Image
                  src={order.payment_proof_url}
                  alt="Payment Proof"
                  width={640}
                  height={360}
                  className="w-full object-contain max-h-48"
                  unoptimized
                />
              </div>
              <button onClick={() => window.open(order.payment_proof_url!, '_blank')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download original
              </button>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-md p-3">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {statusAction === 'completed' ? 'Approve Payment' : 'Reject Payment'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {statusAction === 'completed'
                ? "This will activate the customer's subscription immediately."
                : 'This will mark the payment as failed and notify the customer.'}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 space-y-1 text-sm">
              <p><span className="text-gray-400">Customer:</span> <span className="text-gray-800 dark:text-gray-200">{order.user.email}</span></p>
              {order.package && (
                <p><span className="text-gray-400">Package:</span> <span className="text-gray-800 dark:text-gray-200">{order.package.name} ({metadata?.billing_period})</span></p>
              )}
              <p><span className="text-gray-400">Amount:</span> <span className="text-gray-800 dark:text-gray-200 font-medium">{formatCurrency(order.amount, order.currency)}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder={statusAction === 'completed' ? 'Payment verified…' : 'Rejected due to…'}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#141520] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setStatusModalOpen(false)} disabled={statusMutation.isPending} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
              <button
                onClick={handleStatusUpdate}
                disabled={statusMutation.isPending}
                className={`px-3 py-1.5 text-sm rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-50 ${statusAction === 'completed' ? 'bg-green-600' : 'bg-red-600'}`}
              >
                {statusMutation.isPending ? 'Processing…' : statusAction === 'completed' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
