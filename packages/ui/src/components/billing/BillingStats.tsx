import React from 'react'
import { AlertCircle, Server } from 'lucide-react'
import { Card } from '../card'
import { LoadingSpinner } from '../loading-spinner'
import { BillingData, KeywordUsageData } from './types'

export interface BillingStatsProps {
  billingData: BillingData | null
  currentPackageId: string | null
  formatCurrency: (amount: number) => string
  keywordUsage: KeywordUsageData | null
  usageLoading?: boolean
  expirationText?: string
}

export const BillingStats = ({ 
  billingData, 
  currentPackageId, 
  formatCurrency,
  keywordUsage,
  usageLoading = false,
  expirationText
}: BillingStatsProps) => {
  const { currentSubscription } = billingData || {}

  const getUsagePercentage = (used: number, limit: number, isUnlimited: boolean) => {
    if (isUnlimited || limit <= 0) return 0
    return Math.min(100, (used / limit) * 100)
  }

  return (
    <div className="space-y-6">
      {/* No Active Package Alert */}
      {!currentPackageId && (
        <Card>
          <div className="p-4 border border-warning bg-warning/5 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">No Active Package</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have an active package. Subscribe to a plan below to start tracking your keywords and accessing all features.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Unified Plan & Usage Section */}
      {currentSubscription && (
        <div className="bg-background rounded-lg border border-border p-6">
          {/* Plan Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Plan</h2>
              <h3 className="text-xl font-bold text-foreground mb-1">{currentSubscription.package_name}</h3>
              <p className="text-sm text-muted-foreground">{expirationText || 'Active'}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Payment</h2>
              <div className="text-xl font-bold text-foreground mb-1">
                {formatCurrency(currentSubscription.amount_paid)}
              </div>
              <p className="text-sm text-muted-foreground">per {currentSubscription.billing_period}</p>
            </div>
          </div>

          {/* Usage Stats - Inline 2 Column Layout */}
          {usageLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
              {/* Keywords tracked */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Keywords tracked</span>
                </div>
                <div className="space-y-3">
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {keywordUsage?.keywords_used || 0}
                        {!keywordUsage?.is_unlimited && (keywordUsage?.keywords_limit ?? 0) > 0 && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({Math.round(getUsagePercentage(
                              keywordUsage?.keywords_used || 0, 
                              keywordUsage?.keywords_limit || 0, 
                              keywordUsage?.is_unlimited || false
                            ))}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {keywordUsage?.is_unlimited ? 'Unlimited' : ((keywordUsage?.keywords_limit ?? 0) > 0 ? keywordUsage?.keywords_limit : 'Loading...')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
