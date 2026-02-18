import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../../..';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'keyword_added' | 'rank_improved' | 'rank_declined' | 'domain_added' | 'target_achieved';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: {
    keyword?: string;
    domain?: string;
    position?: number;
    previousPosition?: number;
    url?: string;
  };
}

export type ActivityType = ActivityItem['type'];

interface ActivityTimelineProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
  maxItems?: number;
  showViewAll?: boolean;
  showUpdateBadge?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export const ActivityTimeline = React.memo(function ActivityTimeline({
  activities,
  title = 'Recent Activity',
  description = 'Latest updates and changes',
  maxItems = 5,
  showViewAll = true,
  showUpdateBadge = true,
  onViewAll,
  className = '',
}: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'keyword_added':
        return <Plus className="h-4 w-4" />;
      case 'rank_improved':
        return <TrendingUp className="h-4 w-4" />;
      case 'rank_declined':
        return <TrendingDown className="h-4 w-4" />;
      case 'domain_added':
        return <Globe className="h-4 w-4" />;
      case 'target_achieved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'keyword_added':
        return 'text-[hsl(var(--info-foreground))] bg-[hsl(var(--info)/0.1)]';
      case 'rank_improved':
        return 'text-[hsl(var(--success-foreground))] bg-[hsl(var(--success)/0.1)]';
      case 'rank_declined':
        return 'text-[hsl(var(--error-foreground))] bg-[hsl(var(--error)/0.1)]';
      case 'domain_added':
        return 'text-[hsl(var(--accent-foreground))] bg-[hsl(var(--accent)/0.1)]';
      case 'target_achieved':
        return 'text-[hsl(var(--success-foreground))] bg-[hsl(var(--success)/0.1)]';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'keyword_added':
        return { variant: 'secondary' as const, label: 'New Keyword' };
      case 'rank_improved':
        return {
          variant: 'default' as const,
          label: 'Improved',
          className: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
        };
      case 'rank_declined':
        return { variant: 'destructive' as const, label: 'Declined' };
      case 'domain_added':
        return { variant: 'secondary' as const, label: 'New Domain' };
      case 'target_achieved':
        return {
          variant: 'default' as const,
          label: 'Target Hit',
          className: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
        };
      default:
        return { variant: 'outline' as const, label: 'Update' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);

    // Guard against invalid dates
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // Guard against negative time differences (future dates)
    if (diffInHours < 0) {
      return 'Just now';
    }

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          {showUpdateBadge && (
            <Badge variant="outline" className="flex w-fit items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{activities.length} updates</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity, index) => {
              const badge = getActivityBadge(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  {/* Timeline Icon */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <h4 className="text-foreground truncate text-sm font-medium">
                        {activity.title}
                      </h4>
                      <span className="text-muted-foreground flex-shrink-0 text-xs">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>

                    {activity.description && (
                      <p className="text-muted-foreground mt-1 text-xs">{activity.description}</p>
                    )}

                    {/* Metadata Display */}
                    {activity.metadata && (
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {activity.metadata.keyword && (
                          <span className="flex items-center space-x-1">
                            <Search className="h-3 w-3" />
                            <span className="max-w-32 truncate">{activity.metadata.keyword}</span>
                          </span>
                        )}
                        {activity.metadata.domain && (
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span className="max-w-32 truncate">{activity.metadata.domain}</span>
                          </span>
                        )}
                        {activity.metadata.position && (
                          <span className="font-medium">
                            #{activity.metadata.position}
                            {activity.metadata.previousPosition && (
                              <span className="text-muted-foreground">
                                {' '}
                                (was #{activity.metadata.previousPosition})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        {showViewAll && activities.length > maxItems && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="flex items-center space-x-2"
            >
              <span>View All Activity</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
