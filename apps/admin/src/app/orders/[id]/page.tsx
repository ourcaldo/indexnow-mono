'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAdminOrderDetail, useUpdateOrderStatus } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_payment: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  useAdminPageViewLogger('orders', 'Order Detail', { orderId });
  const [notes, setNotes] = useState('');

  const { data: order, isLoading } = useAdminOrderDetail(orderId);
  const updateStatus = useUpdateOrderStatus(orderId);

  const handleAction = async (status: string) => {
    await updateStatus.mutateAsync({ status, notes: notes || undefined });
    setNotes('');
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-full">
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="px-8 py-5 space-y-4">
          <div className="rounded-xl border border-gray-200 h-32 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 h-40 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white min-h-full flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-sm text-gray-500">Order not found</p>
        <button onClick={() => router.push('/orders')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to orders</button>
      </div>
    );
  }

  const o = order.order || (order as any);
  const isPending = ['pending', 'pending_payment', 'proof_uploaded'].includes(o.transaction_status);

  return (
    <div className="bg-white min-h-full">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-gray-200">
        <button onClick={() => router.push('/orders')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Orders
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Order {o.id?.slice(0, 8)}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ring-1 ${STATUS_STYLES[o.transaction_status] ?? STATUS_STYLES.cancelled}`}>
                {(o.transaction_status ?? '').replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-500 tabular-nums">{format(new Date(o.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{o.currency?.toUpperCase()} {Number(o.amount ?? 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">{o.billing_period || 'one-time'}</div>
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            <InfoCard title="Order Details">
              <InfoRow label="Order ID"><span className="font-mono text-xs text-gray-500">{o.id}</span></InfoRow>
              <InfoRow label="Package">{o.package?.name || '\u2014'}</InfoRow>
              <InfoRow label="Payment method">{o.payment_method || '\u2014'}</InfoRow>
              <InfoRow label="Transaction type">{o.transaction_type || '\u2014'}</InfoRow>
              {o.gateway_transaction_id && <InfoRow label="Transaction ID"><span className="font-mono text-xs text-gray-500">{o.gateway_transaction_id}</span></InfoRow>}
              {o.gateway && <InfoRow label="Gateway">{o.gateway.name}</InfoRow>}
            </InfoCard>

            <InfoCard title="Customer">
              <InfoRow label="Name">{o.user?.full_name || '\u2014'}</InfoRow>
              <InfoRow label="Email">{o.user?.email || '\u2014'}</InfoRow>
              {o.user_id && <InfoRow label="User ID"><button onClick={() => router.push(`/users/${o.user_id}`)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">{o.user_id.slice(0, 12)}...</button></InfoRow>}
            </InfoCard>

            {order.activity_history && order.activity_history.length > 0 && (
              <div className="rounded-xl border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
                </div>
                <div className="px-5 py-3">
                  <div className="relative pl-6 space-y-0 border-l-2 border-gray-100">
                    {order.activity_history.map((event: any, i: number) => (
                      <div key={i} className="relative pb-4 last:pb-0">
                        <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
                        <div className="text-sm text-gray-900">{event.action_description || event.action_type}</div>
                        {event.notes && <div className="text-xs text-gray-500 mt-0.5">{event.notes}</div>}
                        <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">{format(new Date(event.created_at), 'MMM d, HH:mm')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {o.payment_proof_url && (
              <InfoCard title="Payment Proof">
                <div className="py-3">
                  <a href={o.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2">
                    View attachment &rarr;
                  </a>
                </div>
              </InfoCard>
            )}
          </div>

          <div className="space-y-4">
            {isPending && (
              <div className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
                <textarea placeholder="Add notes (optional)..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => handleAction('approved')} disabled={updateStatus.isPending} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction('rejected')} disabled={updateStatus.isPending} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}
            {o.notes && (
              <div className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{o.notes}</p>
              </div>
            )}
            {o.verifier && (
              <div className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Verified by</h3>
                <p className="text-sm text-gray-700">{o.verifier.full_name} ({o.verifier.role})</p>
                {o.verified_at && <p className="text-xs text-gray-500 mt-1">{format(new Date(o.verified_at), 'MMM d, yyyy HH:mm')}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
