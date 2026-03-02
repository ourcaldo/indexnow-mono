'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAdminOrderDetail, useUpdateOrderStatus } from '@/hooks';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-400',
  approved: 'bg-emerald-400',
  pending: 'bg-amber-400',
  pending_payment: 'bg-amber-400',
  rejected: 'bg-red-400',
  cancelled: 'bg-gray-500',
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="text-[13px] text-gray-200 text-right">{children}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [showActions, setShowActions] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: order, isLoading } = useAdminOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus(orderId);

  const handleAction = async (status: string) => {
    await updateStatus.mutateAsync({ status, notes: notes || undefined });
    setShowActions(false);
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-gray-500">Order not found</p>
        <button onClick={() => router.push('/orders')} className="text-sm text-gray-400 hover:text-white transition-colors">
          Back to orders
        </button>
      </div>
    );
  }

  const o = order.order || (order as any);
  const isPending = ['pending', 'pending_payment', 'proof_uploaded'].includes(o.transaction_status);

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/orders')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Order {o.id?.slice(0, 8)}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[o.transaction_status] ?? 'bg-gray-500'}`} />
            <span className="text-[13px] text-gray-400">{(o.transaction_status ?? '').replace(/_/g, ' ')}</span>
            <span className="text-[13px] text-gray-600">·</span>
            <span className="text-[13px] text-gray-600 tabular-nums">
              {format(new Date(o.created_at), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Left */}
        <div className="space-y-8">
          {/* Order info */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Details</h2>
            <div>
              <InfoRow label="Order ID">
                <span className="font-mono text-[12px] text-gray-500">{o.id}</span>
              </InfoRow>
              <InfoRow label="Package">{o.package?.name || '—'}</InfoRow>
              <InfoRow label="Billing period">{o.package?.billing_period || '—'}</InfoRow>
              <InfoRow label="Amount">
                <span className="text-white font-medium">
                  {o.currency?.toUpperCase()} {Number(o.amount ?? 0).toLocaleString()}
                </span>
              </InfoRow>
              <InfoRow label="Payment method">{o.payment_method || '—'}</InfoRow>
              <InfoRow label="Transaction type">{o.transaction_type || '—'}</InfoRow>
              {o.gateway_transaction_id && (
                <InfoRow label="Transaction ID">
                  <span className="font-mono text-[12px] text-gray-500">
                    {o.gateway_transaction_id}
                  </span>
                </InfoRow>
              )}
              {o.gateway && (
                <InfoRow label="Gateway">{o.gateway.name}</InfoRow>
              )}
            </div>
          </section>

          <div className="border-t border-white/[0.06]" />

          {/* Customer */}
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Customer</h2>
            <div>
              <InfoRow label="Name">{o.user?.full_name || '—'}</InfoRow>
              <InfoRow label="Email">{o.user?.email || '—'}</InfoRow>
              {o.user_id && (
                <InfoRow label="User ID">
                  <button
                    onClick={() => router.push(`/users/${o.user_id}`)}
                    className="text-[13px] text-gray-300 hover:text-white transition-colors"
                  >
                    {o.user_id.slice(0, 12)}...
                  </button>
                </InfoRow>
              )}
            </div>
          </section>

          {/* Activity history */}
          {order.activity_history && order.activity_history.length > 0 && (
            <>
              <div className="border-t border-white/[0.06]" />
              <section>
                <h2 className="text-sm font-medium text-white mb-3">Activity</h2>
                <div className="space-y-0">
                  {order.activity_history.map((event: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[13px] text-gray-300">{event.action_description || event.action_type}</div>
                        {event.notes && (
                          <div className="text-[12px] text-gray-600 mt-0.5">{event.notes}</div>
                        )}
                        <div className="text-[11px] text-gray-700 mt-0.5 tabular-nums">
                          {format(new Date(event.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Payment proof */}
          {o.payment_proof_url && (
            <>
              <div className="border-t border-white/[0.06]" />
              <section>
                <h2 className="text-sm font-medium text-white mb-3">Payment Proof</h2>
                <a
                  href={o.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-gray-300 hover:text-white underline underline-offset-2 decoration-gray-700 transition-colors"
                >
                  View attachment
                </a>
              </section>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          {isPending && (
            <section>
              <h2 className="text-sm font-medium text-white mb-3">Actions</h2>
              <div className="space-y-3">
                <textarea
                  placeholder="Add notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] resize-none transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction('approved')}
                    disabled={updateStatus.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-emerald-400 border border-emerald-400/20 rounded-md hover:bg-emerald-400/[0.06] disabled:opacity-40 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('rejected')}
                    disabled={updateStatus.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] text-red-400 border border-red-400/20 rounded-md hover:bg-red-400/[0.06] disabled:opacity-40 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            </section>
          )}

          {o.notes && (
            <section>
              <h2 className="text-sm font-medium text-white mb-2">Notes</h2>
              <p className="text-[13px] text-gray-400 whitespace-pre-wrap">{o.notes}</p>
            </section>
          )}

          {o.verifier && (
            <section>
              <h2 className="text-sm font-medium text-white mb-2">Verified by</h2>
              <p className="text-[13px] text-gray-400">{o.verifier.full_name} ({o.verifier.role})</p>
              {o.verified_at && (
                <p className="text-[12px] text-gray-600 mt-0.5">
                  {format(new Date(o.verified_at), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
