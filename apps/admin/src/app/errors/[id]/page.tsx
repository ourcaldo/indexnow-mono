'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Eye, ExternalLink } from 'lucide-react';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">{title}</h3></div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right max-w-[65%] break-all">{children}</span>
    </div>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export default function ErrorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const errorId = params.id as string;
  useAdminPageViewLogger('errors', 'Error Detail', { errorId });

  const { data: errorDetail, isLoading } = useAdminErrorDetail(errorId);
  const errorAction = useErrorAction(errorId);

  if (isLoading) {
    return (
      <div className="bg-white min-h-full">
        <div className="px-8 py-5 border-b border-gray-200">
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="px-8 py-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 h-40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!errorDetail) {
    return (
      <div className="bg-white min-h-full flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-sm text-gray-500">Error not found</p>
        <button onClick={() => router.push('/errors')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to errors</button>
      </div>
    );
  }

  const err = errorDetail.error || errorDetail;
  const sentry = (errorDetail as any).sentry as { eventId?: string; issueId?: string; url?: string; siblingCount?: number; configured?: boolean } | undefined;

  return (
    <div className="bg-white min-h-full overflow-x-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push('/errors')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Errors
          </button>
          <div className="flex items-center gap-2">
            {sentry?.url && (
              <button
                onClick={() => window.open(sentry.url!, '_blank')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                title="Open in Sentry"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 72 66" fill="currentColor"><path d="M29 2.26a3.68 3.68 0 0 0-6.37 0L.55 45.16a3.68 3.68 0 0 0 3.18 5.52h7.46a3.68 3.68 0 0 0 3.18-1.84l11.87-20.54a12.07 12.07 0 0 1 10.47 11.96h-5.26a3.68 3.68 0 0 0 0 7.36h12.62V40.3a19.43 19.43 0 0 0-16.86-19.26L41.97 2.26a3.68 3.68 0 0 0 6.37 0l21.11 36.53a3.68 3.68 0 0 1-3.18 5.52h-7.46"/></svg>
                Sentry
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${err.severity === 'critical' || err.severity === 'error' ? 'bg-red-500' : err.severity === 'warning' ? 'bg-amber-500' : 'bg-gray-400'}`} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 break-words">{err.message}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${SEVERITY_STYLES[err.severity] || SEVERITY_STYLES.info}`}>{err.severity}</span>
              <span className="text-sm text-gray-500">{err.error_type}</span>
              <span className="text-sm text-gray-500 tabular-nums">{format(new Date(err.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="min-w-0 space-y-4">
            <InfoCard title="Details">
              <InfoRow label="Status">{err.resolved_at ? 'Resolved' : err.acknowledged_at ? 'Acknowledged' : 'Unresolved'}</InfoRow>
              {err.endpoint && <InfoRow label="Endpoint"><span className="font-mono text-xs break-all">{err.http_method} {err.endpoint}</span></InfoRow>}
              {err.status_code && <InfoRow label="Status code">{err.status_code}</InfoRow>}
              {err.user_id && <InfoRow label="User"><button onClick={() => router.push(`/users/${err.user_id}`)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">{err.user_id.slice(0, 12)}...</button></InfoRow>}
            </InfoCard>

            {err.stack_trace && (
              <div className="rounded-xl border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Stack Trace</h3></div>
                <div className="p-5 overflow-hidden">
                  <pre className="text-[11px] bg-gray-900 text-gray-300 rounded-lg p-4 overflow-x-auto max-h-80 whitespace-pre-wrap break-all font-mono">{err.stack_trace}</pre>
                </div>
              </div>
            )}

            {err.metadata && Object.keys(err.metadata).length > 0 && (
              <div className="rounded-xl border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Metadata</h3></div>
                <div className="p-5 overflow-hidden">
                  <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-4 overflow-x-auto break-all font-mono">{JSON.stringify(err.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                {sentry?.url && (
                  <button
                    onClick={() => window.open(sentry.url!, '_blank')}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 72 66" fill="currentColor"><path d="M29 2.26a3.68 3.68 0 0 0-6.37 0L.55 45.16a3.68 3.68 0 0 0 3.18 5.52h7.46a3.68 3.68 0 0 0 3.18-1.84l11.87-20.54a12.07 12.07 0 0 1 10.47 11.96h-5.26a3.68 3.68 0 0 0 0 7.36h12.62V40.3a19.43 19.43 0 0 0-16.86-19.26L41.97 2.26a3.68 3.68 0 0 0 6.37 0l21.11 36.53a3.68 3.68 0 0 1-3.18 5.52h-7.46"/></svg>
                    Open in Sentry
                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                  </button>
                )}
                <button onClick={() => errorAction.mutate('acknowledge')} disabled={errorAction.isPending}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <Eye className="w-4 h-4" /> Acknowledge
                </button>
                <button onClick={() => errorAction.mutate('resolve')} disabled={errorAction.isPending}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Mark Resolved
                </button>
              </div>
            </div>

            {sentry?.siblingCount != null && sentry.siblingCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">{sentry.siblingCount}</span> other error{sentry.siblingCount > 1 ? 's' : ''} share the same Sentry issue. Resolving this error will also resolve them.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
