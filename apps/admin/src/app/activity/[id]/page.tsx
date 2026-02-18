'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
  ErrorState,
} from '@indexnow/ui';
import { type ActivityDetail } from '@indexnow/shared';
import {
  ArrowLeft,
  Activity,
  Clock,
  User,
  Monitor,
  MapPin,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Zap,
  Server,
  AlertCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminActivityDetail } from '@/hooks';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const { data: activity, isLoading: loading, error } = useAdminActivityDetail(activityId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }),
      short: date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getEventIcon = (eventType: string) => {
    const icons = {
      login: LogIn,
      logout: LogOut,
      register: User,
      job_create: Zap,
      job_update: Settings,
      job_delete: XCircle,
      job_start: CheckCircle,
      service_account_add: Shield,
      service_account_delete: XCircle,
      profile_update: User,
      admin_login: Shield,
      user_management: Settings,
      api_call: Server,
      settings_change: Settings,
    };

    return icons[eventType as keyof typeof icons] || Activity;
  };

  const getDeviceInfo = (userAgent?: string | null) => {
    if (!userAgent) return { icon: Monitor, text: 'Desktop', details: 'Unknown Browser' };

    const ua = userAgent.toLowerCase();
    let deviceType = 'Desktop';
    let icon = Monitor;

    if (ua.includes('mobile') || ua.includes('iphone')) {
      deviceType = 'Mobile';
      icon = Smartphone;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'Tablet';
      icon = Tablet;
    }

    let browser = 'Unknown Browser';
    if (ua.includes('chrome')) browser = 'Google Chrome';
    else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Microsoft Edge';

    return { icon, text: deviceType, details: browser };
  };

  if (loading) {
    return (
      <div className="bg-secondary min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-foreground text-2xl font-semibold">Loading Activity Details...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="bg-secondary min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Button onClick={() => router.back()} variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Activity Logs
            </Button>
            <ErrorState
              title="Activity Not Found"
              message={error?.message || 'The requested activity log could not be found.'}
              showHomeButton
            />
          </div>
        </div>
      </div>
    );
  }

  const EventIcon = getEventIcon(activity.event_type);
  const deviceInfo = getDeviceInfo(activity.user_agent);
  const DeviceIcon = deviceInfo.icon;
  const formattedDate = formatDate(activity.created_at);

  return (
    <div className="bg-secondary min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button onClick={() => router.back()} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activity Logs
          </Button>
          <h1 className="text-foreground text-2xl font-semibold">Activity Details</h1>
          <p className="text-muted-foreground mt-2">
            Complete information about this user activity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Activity Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Primary Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-accent/10 rounded-lg p-2">
                    <EventIcon className="text-accent h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-foreground text-xl">
                      {activity.event_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-muted-foreground text-sm font-normal">
                      Activity ID: {activity.id}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-foreground mb-2 text-sm font-medium">Description</h4>
                  <p className="text-foreground bg-secondary rounded-lg p-3">
                    {activity.action_description}
                  </p>
                </div>

                {activity.error_message && (
                  <div>
                    <h4 className="text-error mb-2 text-sm font-medium">Error Details</h4>
                    <div className="bg-error/5 border-error/20 rounded-lg border p-3">
                      <p className="text-error text-sm">{activity.error_message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-foreground mb-2 text-sm font-medium">Status</h4>
                    <div className="flex items-center gap-2">
                      {activity.success ? (
                        <>
                          <CheckCircle className="text-success h-5 w-5" />
                          <span className="text-success font-medium">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="text-error h-5 w-5" />
                          <span className="text-error font-medium">Failed</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-foreground mb-2 text-sm font-medium">Timestamp</h4>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formattedDate.full}</span>
                    </div>
                  </div>
                </div>

                {activity.target_type && (
                  <div>
                    <h4 className="text-foreground mb-2 text-sm font-medium">Target Resource</h4>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {activity.target_type}
                      </div>
                      {activity.target_id && (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">ID:</span>
                          <code className="ml-2 rounded bg-white px-2 py-1 text-xs">
                            {activity.target_id}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            {activity.metadata &&
              typeof activity.metadata === 'object' &&
              !Array.isArray(activity.metadata) &&
              Object.keys(activity.metadata).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-secondary overflow-auto rounded-lg p-4 text-sm">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-border border-b pb-4 text-center">
                  <div className="bg-accent/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
                    <User className="text-accent h-8 w-8" />
                  </div>
                  <h3 className="text-foreground font-medium">{activity.user_name}</h3>
                  <p className="text-muted-foreground text-sm">{activity.user_email}</p>
                </div>

                <Link href={`/users/${activity.user_id}`} className="block">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View User Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-foreground mb-2 text-sm font-medium">Device & Browser</h4>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <DeviceIcon className="h-4 w-4" />
                    <div className="text-sm">
                      <div>{deviceInfo.text}</div>
                      <div className="text-xs">{deviceInfo.details}</div>
                    </div>
                  </div>
                </div>

                {activity.ip_address && (
                  <div>
                    <h4 className="text-foreground mb-2 text-sm font-medium">IP Address</h4>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <code className="bg-secondary rounded px-2 py-1 text-sm">
                        {activity.ip_address}
                      </code>
                    </div>
                  </div>
                )}

                {activity.user_agent && (
                  <div>
                    <h4 className="text-foreground mb-2 text-sm font-medium">User Agent</h4>
                    <p className="text-muted-foreground bg-secondary rounded p-2 text-xs break-all">
                      {activity.user_agent}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Activities */}
            {activity.related_activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">Latest activities from this user</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activity.related_activities.slice(0, 5).map((relatedActivity) => {
                      const RelatedIcon = getEventIcon(relatedActivity.event_type);
                      const relatedDate = formatDate(relatedActivity.created_at);

                      return (
                        <Link
                          key={relatedActivity.id}
                          href={`/activity/${relatedActivity.id}`}
                          className="hover:bg-secondary block rounded p-2 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <RelatedIcon className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate text-sm">
                                {relatedActivity.action_description}
                              </p>
                              <p className="text-muted-foreground text-xs">{relatedDate.short}</p>
                            </div>
                            <div className="flex items-center">
                              {relatedActivity.success ? (
                                <CheckCircle className="text-success h-3 w-3" />
                              ) : (
                                <XCircle className="text-error h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
