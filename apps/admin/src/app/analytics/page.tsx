'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AdminPageSkeleton,
} from '@indexnow/ui';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { formatDate } from '@indexnow/shared';
import { useAdminErrorStats, type TimeRange } from '@/hooks';

export default function ErrorMonitoringDashboard() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const { data, isLoading, isRefetching, refetch } = useAdminErrorStats(timeRange);

  const stats = data?.stats ?? null;
  const criticalErrors = data?.criticalErrors ?? [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getTrendIcon = () => {
    if (!stats) return <Minus className="text-muted-foreground h-4 w-4" />;
    if (stats.trend.direction === 'up') return <TrendingUp className="text-destructive h-4 w-4" />;
    if (stats.trend.direction === 'down') return <TrendingDown className="text-success h-4 w-4" />;
    return <Minus className="text-muted-foreground h-4 w-4" />;
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '24h':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
    }
  };

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="bg-secondary min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-foreground text-2xl font-semibold"
                data-testid="text-dashboard-title"
              >
                Error Monitoring Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                System error tracking, analysis, and resolution management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-[180px]" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isRefetching}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Error Statistics Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-errors">
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4" />
                  Total Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-foreground text-3xl font-bold" data-testid="text-total-errors">
                  {stats.summary.totalErrors.toLocaleString()}
                </div>
                <div className="text-muted-foreground mt-2 flex items-center text-xs">
                  {getTrendIcon()}
                  <span className="ml-1">
                    {Math.abs(stats.trend.value).toFixed(1)}%{' '}
                    {stats.trend.direction === 'up'
                      ? 'increase'
                      : stats.trend.direction === 'down'
                        ? 'decrease'
                        : 'stable'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-critical-errors">
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="text-destructive h-4 w-4" />
                  Critical Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-destructive text-3xl font-bold"
                  data-testid="text-critical-errors"
                >
                  {stats.summary.criticalErrors.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">Requires immediate attention</p>
              </CardContent>
            </Card>

            <Card data-testid="card-high-errors">
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600" data-testid="text-high-errors">
                  {stats.summary.highErrors.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">High severity issues</p>
              </CardContent>
            </Card>

            <Card data-testid="card-unresolved-errors">
              <CardHeader className="pb-3">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Unresolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-3xl font-bold text-yellow-600"
                  data-testid="text-unresolved-errors"
                >
                  {stats.summary.unresolvedErrors.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">Pending resolution</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Distribution Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* By Severity */}
            <Card data-testid="card-severity-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" />
                  By Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.distributions.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-foreground text-sm">{severity}</span>
                      <Badge variant="secondary" className={getSeverityColor(severity)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Type */}
            <Card data-testid="card-type-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Server className="h-4 w-4" />
                  By Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.distributions.byType)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-foreground truncate text-sm">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Endpoints */}
            <Card data-testid="card-endpoint-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Top Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.distributions.byEndpoint.map(({ endpoint, count }) => (
                    <div key={endpoint} className="flex items-center justify-between">
                      <span className="text-foreground max-w-[200px] truncate text-sm text-ellipsis">
                        {endpoint}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Critical Errors List */}
        <Card data-testid="card-critical-errors-list">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  Critical Errors
                </CardTitle>
                <CardDescription className="mt-1">
                  Unresolved critical errors requiring immediate attention
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/errors')}
                data-testid="button-view-all-errors"
              >
                <Eye className="mr-2 h-4 w-4" />
                View All Errors
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {criticalErrors.length > 0 ? (
              <div className="space-y-4">
                {criticalErrors.map((error) => (
                  <div
                    key={error.id}
                    className="bg-secondary border-border hover:border-destructive/20 cursor-pointer rounded-lg border p-4 transition-colors"
                    onClick={() => router.push(`/errors/${error.id}`)}
                    data-testid={`error-item-${error.id}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <XCircle className="text-destructive h-4 w-4 flex-shrink-0" />
                          <Badge variant="secondary" className="text-xs">
                            {error.error_type}
                          </Badge>
                          <h4
                            className="text-foreground text-sm font-medium"
                            data-testid={`error-message-${error.id}`}
                          >
                            {error.message}
                          </h4>
                        </div>
                        {error.endpoint && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {error.http_method && (
                              <span className="mr-2 font-mono">{error.http_method}</span>
                            )}
                            <code className="bg-muted rounded px-1">{error.endpoint}</code>
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-muted-foreground text-xs">
                          {formatDate(error.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-12 text-center">
                <CheckCircle className="text-success mx-auto mb-4 h-12 w-12" />
                <p className="text-sm">No critical errors found</p>
                <p className="mt-1 text-xs">System is running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Errors */}
        {stats && stats.topErrors.length > 0 && (
          <Card className="mt-6" data-testid="card-top-errors">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Most Common Errors</CardTitle>
              <CardDescription>
                Top 5 errors by occurrence in {getTimeRangeLabel().toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topErrors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-secondary flex items-start justify-between rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary" className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {error.error_type}
                        </Badge>
                      </div>
                      <p className="text-foreground mt-1 text-sm">{error.message}</p>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <span className="text-foreground text-lg font-bold">{error.count}</span>
                        <p className="text-muted-foreground text-xs">occurrences</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
