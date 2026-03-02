'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';
import { format } from 'date-fns';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-gray-200 text-right max-w-[65%] break-all">{children}</span>
    </div>
  );
}

export default function ErrorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const errorId = params.id as string;

  const { data: errorDetail, isLoading } = useAdminErrorDetail(errorId);
  const errorAction = useErrorAction(errorId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!errorDetail) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-gray-500">Error not found</p>
        <button onClick={() => router.push('/errors')} className="text-sm text-gray-400 hover:text-white transition-colors">
          Back to errors
        </button>
      </div>
    );
  }

  const err = errorDetail.error || errorDetail;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/errors')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Errors
      </button>

      <div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              err.severity === 'critical' || err.severity === 'error'
                ? 'bg-red-400'
                : err.severity === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-gray-500'
            }`}
          />
          <h1 className="text-lg font-semibold text-white">{err.message}</h1>
        </div>
        <p className="text-[13px] text-gray-500 mt-1">
          {err.error_type} · {format(new Date(err.created_at), 'MMM d, yyyy HH:mm:ss')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Left */}
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Details</h2>
            <div>
              <DetailRow label="Severity">
                <span
                  className={
                    err.severity === 'critical' || err.severity === 'error'
                      ? 'text-red-400'
                      : err.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-gray-400'
                  }
                >
                  {err.severity}
                </span>
              </DetailRow>
              <DetailRow label="Type">{err.error_type}</DetailRow>
              {err.endpoint && (
                <DetailRow label="Endpoint">
                  <span className="font-mono text-[12px]">
                    {err.http_method} {err.endpoint}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Status">
                {err.resolved_at
                  ? 'Resolved'
                  : err.acknowledged_at
                    ? 'Acknowledged'
                    : 'Unresolved'}
              </DetailRow>
              {err.status_code && (
                <DetailRow label="Status code">{err.status_code}</DetailRow>
              )}
              {err.user_id && (
                <DetailRow label="User">
                  <button
                    onClick={() => router.push(`/users/${err.user_id}`)}
                    className="text-[13px] text-gray-300 hover:text-white transition-colors"
                  >
                    {err.user_id.slice(0, 12)}...
                  </button>
                </DetailRow>
              )}
            </div>
          </section>

          {/* Stack trace */}
          {err.stack_trace && (
            <>
              <div className="border-t border-white/[0.06]" />
              <section>
                <h2 className="text-sm font-medium text-white mb-3">Stack trace</h2>
                <pre className="text-[11px] text-gray-400 bg-white/[0.02] border border-white/[0.04] rounded-md p-3 overflow-x-auto max-h-80 whitespace-pre-wrap font-mono">
                  {err.stack_trace}
                </pre>
              </section>
            </>
          )}

          {/* Metadata */}
          {err.metadata && Object.keys(err.metadata).length > 0 && (
            <>
              <div className="border-t border-white/[0.06]" />
              <section>
                <h2 className="text-sm font-medium text-white mb-3">Metadata</h2>
                <pre className="text-[11px] text-gray-400 bg-white/[0.02] border border-white/[0.04] rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(err.metadata, null, 2)}
                </pre>
              </section>
            </>
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => errorAction.mutate('acknowledge')}
                disabled={errorAction.isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-gray-300 border border-white/[0.08] rounded-md hover:bg-white/[0.04] hover:text-white disabled:opacity-40 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Acknowledge
              </button>
              <button
                onClick={() => errorAction.mutate('resolve')}
                disabled={errorAction.isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-emerald-400/80 border border-emerald-400/10 rounded-md hover:bg-emerald-400/[0.06] hover:text-emerald-400 disabled:opacity-40 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Resolve
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
