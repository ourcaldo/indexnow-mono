'use client'

import { CalendarDays, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@indexnow/ui'
import {
  formatRelativeTime,
  type AdminTransactionHistory,
  type AdminOrderActivityLog,
  type Json
} from '@indexnow/shared'

interface OrderActivityTimelineProps {
  transactionHistory: AdminTransactionHistory[] | undefined
  activityHistory: AdminOrderActivityLog[] | undefined
}

interface UnifiedActivity {
  id: string
  type: 'transaction' | 'activity'
  event_type: string
  action_description: string
  created_at: string
  user: { full_name: string; role?: string | null }
  metadata: Record<string, Json>
}

function mergeAndSortActivity(
  transactionHistory: AdminTransactionHistory[] | undefined,
  activityHistory: AdminOrderActivityLog[] | undefined
): UnifiedActivity[] {
  const txItems: UnifiedActivity[] = (transactionHistory || []).map(th => {
    const thMetadata = (th.metadata as Record<string, Json>) || {}
    return {
      id: th.id,
      type: 'transaction' as const,
      event_type: th.action_type,
      action_description: th.action_description,
      created_at: th.created_at,
      user: th.user || { full_name: th.changed_by_type === 'admin' ? 'Admin User' : 'System', role: th.changed_by_type },
      metadata: {
        old_status: th.old_status,
        new_status: th.new_status,
        notes: th.notes,
        ...thMetadata
      }
    }
  })

  const actItems: UnifiedActivity[] = (activityHistory || []).map(ah => {
    const ahMetadata = (ah.metadata as Record<string, Json>) || {}
    return {
      id: ah.id,
      type: 'activity' as const,
      event_type: ah.action_type,
      action_description: ah.action_description,
      created_at: ah.created_at,
      user: ah.user || { full_name: 'System', role: 'system' },
      metadata: ahMetadata
    }
  })

  return [...txItems, ...actItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function OrderActivityTimeline({ transactionHistory, activityHistory }: OrderActivityTimelineProps) {
  const allActivity = mergeAndSortActivity(transactionHistory, activityHistory)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Activity className="w-5 h-5 mr-2" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allActivity.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border"></div>

              {allActivity.map((activity) => (
                <div key={activity.id} className="relative flex items-start space-x-3 pb-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-4 h-4 bg-brand-accent rounded-full border-2 border-background relative z-10"></div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action_description}</p>

                    {/* Enhanced display for transaction history */}
                    {activity.type === 'transaction' && activity.metadata?.old_status && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {activity.metadata.old_status as string} → {activity.metadata.new_status as string}
                      </p>
                    )}

                    {activity.metadata?.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        &quot;{activity.metadata.notes as string}&quot;
                      </p>
                    )}

                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                      <CalendarDays className="w-3 h-3" />
                      <span>{formatRelativeTime(activity.created_at)}</span>
                      {activity.user?.full_name && (
                        <>
                          <span>•</span>
                          <span>{activity.user.full_name}</span>
                          {activity.user.role && (
                            <span className="text-brand-accent">({activity.user.role})</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
