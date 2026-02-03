import React from 'react'
import { Package2, Users } from 'lucide-react'
import { LoadingSpinner } from '../loading-spinner'
import { KeywordUsageData } from './types'

export interface UsageOverviewCardProps {
  packageName: string
  hasActiveSubscription: boolean
  expirationText: string
  keywordUsage: KeywordUsageData | null
  loading?: boolean
}

export const UsageOverviewCard = ({
  packageName,
  hasActiveSubscription,
  expirationText,
  keywordUsage,
  loading = false
}: UsageOverviewCardProps) => {
  if (loading) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center justify-center min-h-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const getUsagePercentage = (used: number, limit: number, isUnlimited: boolean) => {
    if (isUnlimited || limit <= 0) return 0
    return Math.min(100, (used / limit) * 100)
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-info/10">
          <Package2 className="h-5 w-5 text-info" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Plan & Usage</h2>
          <p className="text-sm text-muted-foreground">Current subscription and usage limits</p>
        </div>
      </div>

      {/* Plan Info - Vertical Layout */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">{packageName}</h3>
          {hasActiveSubscription && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success border border-success/20">
              Active
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {hasActiveSubscription ? 'Active subscription' : 'No active subscription'}
          </p>
          <p className="text-sm font-medium text-foreground">
            {expirationText}
          </p>
        </div>
      </div>

      {/* Usage & Limits - Vertical Layout */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-4">Usage & Limits</h4>
        
        <div className="grid gap-6">
          {/* Keywords tracked */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Keywords tracked</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{keywordUsage?.keywords_used || 0}</span>
                <span className="text-sm text-muted-foreground">
                  of {keywordUsage?.is_unlimited ? '∞' : (keywordUsage?.keywords_limit || 0)}
                </span>
              </div>
              {!keywordUsage?.is_unlimited && (
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-warning h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getUsagePercentage(
                        keywordUsage?.keywords_used || 0, 
                        keywordUsage?.keywords_limit || 0, 
                        keywordUsage?.is_unlimited || false
                      )}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
