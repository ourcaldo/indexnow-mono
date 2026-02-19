'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, ErrorState } from '@indexnow/ui';
import {
  ArrowLeft,
  Activity,
  Clock,
  User,
  Monitor,
  MapPin,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, EnrichedActivityLog } from '@indexnow/shared';
import { useAdminUserActivity } from '@/hooks';

interface ActivityLog {
  id: string;
  user_id: string;
  event_type: string;
  action_description: string;
  target_type?: string;
  target_id?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: DeviceInfo;
  location_data?: LocationData;
  success: boolean;
  error_message?: string;
  metadata?: ActivityMetadata;
  created_at: string;
}

interface UserInfo {
  id: string;
  name: string;
}

interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  [key: string]: unknown;
}

interface LocationData {
  city?: string;
  country?: string;
  ip?: string;
  [key: string]: unknown;
}

interface ActivityMetadata {
  device_info?: DeviceInfo;
  location_data?: LocationData;
  [key: string]: unknown;
}

export default function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  const {
    data,
    isLoading: loading,
    error,
  } = useAdminUserActivity(resolvedParams?.id ?? '', currentPage);

  const logs = data?.logs ?? [];
  const user = data?.user ?? null;
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 };

  const getEventTypeBadge = (eventType: string, success: boolean) => {
    const colors = {
      login: success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
      logout: 'bg-muted/10 text-muted-foreground',
      job_create: 'bg-primary/10 text-primary',
      job_update: 'bg-warning/10 text-warning',
      job_delete: 'bg-destructive/10 text-destructive',
      profile_update: 'bg-primary/10 text-primary',
      api_call: 'bg-muted/10 text-muted-foreground',
    };

    return colors[eventType as keyof typeof colors] || 'bg-muted/10 text-muted-foreground';
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;

    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('Android') ||
      userAgent.includes('iPhone')
    ) {
      return <Smartphone className="h-4 w-4" />;
    }

    return <Monitor className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-4">
              <Link href="/users">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Users
                </Button>
              </Link>
            </div>
            <h1 className="text-foreground text-2xl font-semibold">User Activity History</h1>
            <p className="text-muted-foreground mt-2">Loading user activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-4">
              <Link href="/users">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Users
                </Button>
              </Link>
            </div>
            <h1 className="text-foreground text-2xl font-semibold">User Activity History</h1>
            <div className="mt-4">
              <ErrorState
                title="Failed to load user activity"
                message={error.message}
                onRetry={() => window.location.reload()}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Link href="/users">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
            {resolvedParams?.id && (
              <Link href={`/users/${resolvedParams.id}`}>
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  View User Profile
                </Button>
              </Link>
            )}
          </div>
          <h1 className="text-foreground text-2xl font-semibold">
            Activity History: {user?.name || 'Loading...'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete activity timeline for this user including logins, actions, and system
            interactions
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Activity className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">{logs.length}</p>
                  <p className="text-muted-foreground text-xs">Total Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 rounded-lg p-2">
                  <CheckCircle className="text-success h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {logs.filter((l) => l.success).length}
                  </p>
                  <p className="text-muted-foreground text-xs">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-destructive/10 rounded-lg p-2">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {logs.filter((l) => !l.success).length}
                  </p>
                  <p className="text-muted-foreground text-xs">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-warning/10 rounded-lg p-2">
                  <Activity className="text-warning h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {new Set(logs.map((l) => l.event_type)).size}
                  </p>
                  <p className="text-muted-foreground text-xs">Event Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Timeline ({logs.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-muted-foreground">No activity found for this user</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-border hover:bg-background rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start space-x-4">
                        {/* Timestamp */}
                        <div className="flex items-center gap-2 sm:min-w-[140px]">
                          <Clock className="text-muted-foreground h-4 w-4" />
                          <span className="text-foreground text-sm font-medium">
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        {/* Event/Action */}
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge
                              className={`${getEventTypeBadge(log.event_type, log.success)} border-0 text-xs`}
                            >
                              {log.event_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {!log.success && (
                              <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
                                FAILED
                              </Badge>
                            )}
                          </div>
                          <p className="text-foreground mb-1 text-sm">{log.action_description}</p>
                          {log.error_message && (
                            <p className="text-destructive text-xs">Error: {log.error_message}</p>
                          )}
                        </div>

                        {/* IP and Device */}
                        <div className="text-muted-foreground flex items-center gap-4 text-xs sm:min-w-[180px]">
                          {log.ip_address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="font-mono">{log.ip_address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {getDeviceIcon(log.user_agent)}
                          </div>
                        </div>
                      </div>

                      {/* Link to Activity Detail */}
                      <Link href={`/activity/${log.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-background h-8 w-8 p-0"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} entries
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
