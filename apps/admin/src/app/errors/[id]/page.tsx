'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
      <div className="space-y-4">
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />)}
      </div>
    );
  }

  if (!errorDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-sm text-gray-500">Error not found</p>
        <button onClick={() => router.push('/errors')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to errors</button>
      </div>
    );
  }

  const err = errorDetail.error || errorDetail;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/errors')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Errors
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${err.severity === 'critical' || err.severity === 'error' ? 'bg-red-500' : err.severity === 'warning' ? 'bg-amber-500' : 'bg-gray-400'}`} />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{err.message}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ring-1 ${SEVERITY_STYLES[err.severity] || SEVERITY_STYLES.info}`}>{err.severity}</span>
              <span className="text-sm text-gray-500">{err.error_type}</span>
              <span className="text-sm text-gray-500 tabular-nums">{format(new Date(err.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          <InfoCard title="Details">
            <InfoRow label="Status">{err.resolved_at ? 'Resolved' : err.acknowledged_at ? 'Acknowledged' : 'Unresolved'}</InfoRow>
            {err.endpoint && <InfoRow label="Endpoint"><span className="font-mono text-xs">{err.http_method} {err.endpoint}</span></InfoRow>}
            {err.status_code && <InfoRow label="Status code">{err.status_code}</InfoRow>}
            {err.user_id && <InfoRow label="User"><button onClick={() => router.push(`/users/${err.user_id}`)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">{err.user_id.slice(0, 12)}...</button></InfoRow>}
          </InfoCard>

          {err.stack_trace && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Stack Trace</h3></div>
              <div className="p-5">
                <pre className="text-[11px] bg-gray-900 text-gray-300 rounded-lg p-4 overflow-x-auto max-h-80 whitespace-pre-wrap font-mono">{err.stack_trace}</pre>
              </div>
            </div>
          )}

          {err.metadata && Object.keys(err.metadata).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Metadata</h3></div>
              <div className="p-5">
                <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-4 overflow-x-auto font-mono">{JSON.stringify(err.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
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
        </div>
      </div>
    </div>
  );
}
