'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { ErrorResolveActions } from '@/components/ErrorResolveActions';
import { CodeBlock } from '@/components/CodeBlock';
import { InfoCard, InfoRow } from '@/components/shared-primitives';
import {
  getSeverityDotColor,
  getErrorStatus,
  formatErrorDate,
  hasMetadata,
} from '@/lib/error-helpers';

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
      <div className="min-h-full bg-white">
        <div className="border-b border-gray-200 px-8 py-5">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="space-y-4 px-8 py-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!errorDetail) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center space-y-3 bg-white py-24">
        <p className="text-sm text-gray-500">Error not found</p>
        <button
          onClick={() => router.push('/errors')}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to errors
        </button>
      </div>
    );
  }

  const err = errorDetail.error;
  const sentry = errorDetail.sentry;
  const resolverInfo = errorDetail.resolverInfo;

  return (
    <div className="min-h-full overflow-x-hidden bg-white">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="border-b border-gray-200 px-8 py-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/errors')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Errors
          </button>
          <div className="flex items-center gap-2">
            {sentry?.url && (
              <button
                onClick={() => window.open(sentry.url!, '_blank')}
                className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                title="Open in Sentry"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 72 66" fill="currentColor">
                  <path d="M29 2.26a3.68 3.68 0 0 0-6.37 0L.55 45.16a3.68 3.68 0 0 0 3.18 5.52h7.46a3.68 3.68 0 0 0 3.18-1.84l11.87-20.54a12.07 12.07 0 0 1 10.47 11.96h-5.26a3.68 3.68 0 0 0 0 7.36h12.62V40.3a19.43 19.43 0 0 0-16.86-19.26L41.97 2.26a3.68 3.68 0 0 0 6.37 0l21.11 36.53a3.68 3.68 0 0 1-3.18 5.52h-7.46" />
                </svg>
                Sentry
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className={`mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ${getSeverityDotColor(err.severity)}`}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold break-words text-gray-900">{err.message}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_STYLES[err.severity] || SEVERITY_STYLES.info}`}
              >
                {err.severity}
              </span>
              <span className="text-sm text-gray-500">{err.error_type}</span>
              <span className="text-sm text-gray-500 tabular-nums">
                {formatErrorDate(err.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4">
            <InfoCard title="Details">
              <InfoRow label="Status">
                <span className={`font-medium ${getErrorStatus(err).colorClass}`}>
                  {getErrorStatus(err).label}
                </span>
              </InfoRow>
              <InfoRow label="Recorded">
                {formatErrorDate(err.created_at)}
              </InfoRow>
              {err.acknowledged_at && (
                <InfoRow label="Acknowledged">
                  {formatErrorDate(err.acknowledged_at)}
                </InfoRow>
              )}
              {err.resolved_at && (
                <InfoRow label="Resolved">
                  <div className="text-right">
                    <div>{formatErrorDate(err.resolved_at)}</div>
                    {resolverInfo && (
                      <div className="mt-0.5 text-xs text-gray-400">
                        by {resolverInfo.full_name || resolverInfo.email || 'Admin'}
                      </div>
                    )}
                    {!resolverInfo && err.resolved_by === null && (
                      <div className="mt-0.5 text-xs text-gray-400">by Sentry webhook</div>
                    )}
                  </div>
                </InfoRow>
              )}
              {err.endpoint && (
                <InfoRow label="Endpoint">
                  <span className="font-mono text-xs break-all">
                    {err.http_method} {err.endpoint}
                  </span>
                </InfoRow>
              )}
              {err.status_code && <InfoRow label="Status code">{err.status_code}</InfoRow>}
              {err.user_id && (
                <InfoRow label="User">
                  <button
                    onClick={() => router.push(`/users/${err.user_id}`)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {err.user_id.slice(0, 12)}...
                  </button>
                </InfoRow>
              )}
              {sentry?.issueId && (
                <InfoRow label="Sentry Issue">
                  <button
                    onClick={() => sentry.url && window.open(sentry.url, '_blank')}
                    className="font-mono text-sm font-medium text-purple-600 hover:text-purple-700"
                  >
                    #{sentry.issueId}
                  </button>
                </InfoRow>
              )}
            </InfoCard>

            {err.stack_trace && (
              <CodeBlock title="Stack Trace" content={err.stack_trace} variant="dark" />
            )}

            {hasMetadata(err.metadata) && (
              <CodeBlock
                title="Metadata"
                content={JSON.stringify(err.metadata, null, 2)}
                variant="light"
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Actions</h3>
              <div className="space-y-2">
                {sentry?.url && (
                  <button
                    onClick={() => window.open(sentry.url!, '_blank')}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 72 66" fill="currentColor">
                      <path d="M29 2.26a3.68 3.68 0 0 0-6.37 0L.55 45.16a3.68 3.68 0 0 0 3.18 5.52h7.46a3.68 3.68 0 0 0 3.18-1.84l11.87-20.54a12.07 12.07 0 0 1 10.47 11.96h-5.26a3.68 3.68 0 0 0 0 7.36h12.62V40.3a19.43 19.43 0 0 0-16.86-19.26L41.97 2.26a3.68 3.68 0 0 0 6.37 0l21.11 36.53a3.68 3.68 0 0 1-3.18 5.52h-7.46" />
                    </svg>
                    Open in Sentry
                    <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </button>
                )}
                <ErrorResolveActions
                  sentry={sentry}
                  isPending={errorAction.isPending}
                  isResolved={!!err.resolved_at}
                  isAcknowledged={!!err.acknowledged_at}
                  onAction={(action) => errorAction.mutate(action)}
                />
              </div>
            </div>

            {sentry?.siblingCount != null && sentry.siblingCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">{sentry.siblingCount}</span> other error
                  {sentry.siblingCount > 1 ? 's' : ''} share the same Sentry issue. Resolving this
                  error will also resolve them.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
