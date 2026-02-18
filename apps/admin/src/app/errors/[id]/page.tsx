'use client';

import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  XCircle,
  Calendar,
  Code,
  Globe,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  useToast,
  ErrorState,
} from '@indexnow/ui';
import { formatDate, formatRelativeTime, type ErrorDetailResponse } from '@indexnow/shared';
import { useAdminErrorDetail, useErrorAction } from '@/hooks';

export default function AdminErrorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const errorId = params.id as string;

  const { data: errorData, isLoading: loading, error, refetch } = useAdminErrorDetail(errorId);
  const actionMutation = useErrorAction(errorId);

  const handleAction = async (action: 'acknowledge' | 'resolve') => {
    try {
      await actionMutation.mutateAsync(action);

      addToast({
        type: 'success',
        title: 'Success',
        description: `Error has been ${action}d successfully`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} error`;
      addToast({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-warning/80 text-warning-foreground">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-muted text-muted-foreground">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-muted/50 text-muted-foreground">Low</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{severity}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-foreground mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading error details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <ErrorState
          title="Error Loading Details"
          message={error.message}
          onRetry={() => refetch()}
          showHomeButton
        />
      </div>
    );
  }

  if (!errorData) return null;

  const { error: errorDetail, userInfo, relatedErrors } = errorData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold" data-testid="text-page-title">
              Error Details
            </h1>
            <p className="text-muted-foreground">View and manage error information</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">{getSeverityBadge(errorDetail.severity)}</div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* COLUMN 1 */}
        <div className="space-y-6">
          {/* Error Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Error Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">Error ID</label>
                <code
                  className="bg-muted mt-1 block rounded px-2 py-1 text-xs"
                  data-testid="text-error-id"
                >
                  {errorDetail.id}
                </code>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">Error Type</label>
                <code
                  className="bg-muted mt-1 block rounded px-2 py-1 text-xs"
                  data-testid="text-error-type"
                >
                  {errorDetail.error_type}
                </code>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">User Message</label>
                <p className="text-foreground mt-1 text-sm" data-testid="text-user-message">
                  {errorDetail.user_message}
                </p>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Technical Message
                </label>
                <pre
                  className="bg-muted mt-1 overflow-x-auto rounded p-3 text-xs"
                  data-testid="text-technical-message"
                >
                  {errorDetail.message}
                </pre>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {errorDetail.status_code && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">Status Code</label>
                    <p className="text-foreground mt-1 text-sm" data-testid="text-status-code">
                      {errorDetail.status_code}
                    </p>
                  </div>
                )}
                {errorDetail.http_method && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">HTTP Method</label>
                    <Badge variant="outline" className="mt-1" data-testid="text-http-method">
                      {errorDetail.http_method}
                    </Badge>
                  </div>
                )}
              </div>

              {errorDetail.endpoint && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Endpoint</label>
                  <code
                    className="bg-muted mt-1 block rounded px-2 py-1 text-xs break-all"
                    data-testid="text-endpoint"
                  >
                    {errorDetail.endpoint}
                  </code>
                </div>
              )}

              <div>
                <label className="text-muted-foreground text-sm font-medium">Created At</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <p className="text-foreground text-sm" data-testid="text-created-at">
                    {formatDate(errorDetail.created_at)}
                  </p>
                  <span className="text-muted-foreground text-xs">
                    ({formatRelativeTime(errorDetail.created_at)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          {userInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Affected User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Email</label>
                  <p className="text-foreground mt-1 text-sm" data-testid="text-user-email">
                    {userInfo.email}
                  </p>
                </div>
                {userInfo.full_name && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">Full Name</label>
                    <p className="text-foreground mt-1 text-sm">{userInfo.full_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stack Trace */}
          {errorDetail.stack_trace && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Code className="mr-2 h-5 w-5" />
                  Stack Trace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre
                  className="bg-muted max-h-96 overflow-x-auto rounded p-3 text-xs"
                  data-testid="text-stack-trace"
                >
                  {errorDetail.stack_trace}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUMN 2 */}
        <div className="space-y-6">
          {/* Resolution Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Resolution Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorDetail.resolved_at ? (
                <div className="text-success flex items-center gap-2" data-testid="status-resolved">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(errorDetail.resolved_at)}
                    </p>
                  </div>
                </div>
              ) : errorDetail.acknowledged_at ? (
                <div
                  className="text-warning flex items-center gap-2"
                  data-testid="status-acknowledged"
                >
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Acknowledged</p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(errorDetail.acknowledged_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-destructive flex items-center gap-2" data-testid="status-new">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Not Acknowledged</p>
                    <p className="text-muted-foreground text-xs">Requires attention</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!errorDetail.resolved_at && (
                <div className="flex flex-col gap-2 pt-4">
                  {!errorDetail.acknowledged_at && (
                    <Button
                      onClick={() => handleAction('acknowledge')}
                      disabled={actionMutation.isPending}
                      className="w-full"
                      variant="outline"
                      data-testid="button-acknowledge"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {actionMutation.isPending ? 'Processing...' : 'Acknowledge Error'}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleAction('resolve')}
                    disabled={actionMutation.isPending}
                    className="bg-success hover:bg-success/90 text-success-foreground w-full"
                    data-testid="button-resolve"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {actionMutation.isPending ? 'Processing...' : 'Mark as Resolved'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Errors */}
          {relatedErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Related Errors (Last 24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="list-related-errors">
                  {relatedErrors.slice(0, 10).map((relError) => (
                    <div
                      key={relError.id}
                      className="bg-secondary hover:bg-secondary/80 cursor-pointer rounded-lg p-3 transition-colors"
                      onClick={() => router.push(`/errors/${relError.id}`)}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <code className="text-foreground text-xs font-medium">
                          {relError.error_type}
                        </code>
                        {getSeverityBadge(relError.severity)}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{relError.message}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatRelativeTime(relError.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
