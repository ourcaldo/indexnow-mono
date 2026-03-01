'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Code,
  Globe,
  Activity,
  Calendar,
} from 'lucide-react';
import { formatDate, formatRelativeTime, type ErrorDetailResponse } from '@indexnow/shared';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls[severity] ?? cls.LOW}`}>
      {severity}
    </span>
  );
}

export default function AdminErrorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const errorId = params.id as string;

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const { data: errorData, isLoading: loading, error, refetch } = useAdminErrorDetail(errorId);
  const actionMutation = useErrorAction(errorId);

  const handleAction = async (action: 'acknowledge' | 'resolve') => {
    setMsg(null);
    try {
      await actionMutation.mutateAsync(action);
      setMsg({ type: 'ok', text: `Error ${action}d successfully.` });
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : `Failed to ${action} error` });
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading error details…</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Failed to load</p>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!errorData) return null;

  const { error: errorDetail, userInfo, relatedErrors } = errorData as ErrorDetailResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Error Details</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            View and manage error information
          </p>
        </div>
        <SeverityBadge severity={errorDetail.severity} />
      </div>

      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.type === 'ok'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1 */}
        <div className="space-y-6">
          {/* Error Overview */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141520]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <AlertCircle className="h-4 w-4" />
              Error Overview
            </div>
            <div className="space-y-4">
              <Row label="Error ID">
                <code className="block rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-800/60">
                  {errorDetail.id}
                </code>
              </Row>
              <Row label="Error Type">
                <code className="block rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-800/60">
                  {errorDetail.error_type}
                </code>
              </Row>
              {errorDetail.user_message && (
                <Row label="User Message">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{errorDetail.user_message}</p>
                </Row>
              )}
              <Row label="Technical Message">
                <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-800/60">
                  {errorDetail.message}
                </pre>
              </Row>
              {(errorDetail.status_code || errorDetail.http_method) && (
                <div className="flex gap-6">
                  {errorDetail.status_code && (
                    <Row label="Status Code">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{errorDetail.status_code}</span>
                    </Row>
                  )}
                  {errorDetail.http_method && (
                    <Row label="HTTP Method">
                      <span className="inline-block rounded border border-gray-200 px-2 py-0.5 text-xs dark:border-gray-700">
                        {errorDetail.http_method}
                      </span>
                    </Row>
                  )}
                </div>
              )}
              {errorDetail.endpoint && (
                <Row label="Endpoint">
                  <code className="block break-all rounded bg-gray-50 px-2 py-1 text-xs dark:bg-gray-800/60">
                    {errorDetail.endpoint}
                  </code>
                </Row>
              )}
              <Row label="Created At">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(errorDetail.created_at)}
                  <span className="text-xs text-gray-400">
                    ({formatRelativeTime(errorDetail.created_at)})
                  </span>
                </div>
              </Row>
            </div>
          </div>

          {/* Affected User */}
          {userInfo && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141520]">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <User className="h-4 w-4" />
                Affected User
              </div>
              <div className="space-y-3">
                <Row label="Email">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{userInfo.email}</span>
                </Row>
                {userInfo.full_name && (
                  <Row label="Full Name">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{userInfo.full_name}</span>
                  </Row>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {errorDetail.stack_trace && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141520]">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Code className="h-4 w-4" />
                Stack Trace
              </div>
              <pre className="max-h-96 overflow-x-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-800/60">
                {errorDetail.stack_trace}
              </pre>
            </div>
          )}
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          {/* Resolution Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141520]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <Activity className="h-4 w-4" />
              Resolution Status
            </div>
            <div className="space-y-4">
              {errorDetail.resolved_at ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(errorDetail.resolved_at)}</p>
                  </div>
                </div>
              ) : errorDetail.acknowledged_at ? (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Acknowledged</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(errorDetail.acknowledged_at)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Not Acknowledged</p>
                    <p className="text-xs text-gray-500">Requires attention</p>
                  </div>
                </div>
              )}

              {!errorDetail.resolved_at && (
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  {!errorDetail.acknowledged_at && (
                    <button
                      onClick={() => handleAction('acknowledge')}
                      disabled={actionMutation.isPending}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Clock className="h-4 w-4" />
                      {actionMutation.isPending ? 'Processing…' : 'Acknowledge Error'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('resolve')}
                    disabled={actionMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {actionMutation.isPending ? 'Processing…' : 'Mark as Resolved'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Related Errors */}
          {relatedErrors.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#141520]">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Globe className="h-4 w-4" />
                Related Errors — Last 24h
              </div>
              <div className="space-y-2">
                {relatedErrors.slice(0, 10).map((relError: { id: string; error_type: string; severity: string; message: string; created_at: string }) => (
                  <button
                    key={relError.id}
                    onClick={() => router.push(`/errors/${relError.id}`)}
                    className="w-full rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <code className="text-xs font-medium text-gray-900 dark:text-white">
                        {relError.error_type}
                      </code>
                      <SeverityBadge severity={relError.severity} />
                    </div>
                    <p className="truncate text-xs text-gray-500">{relError.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTime(relError.created_at)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
