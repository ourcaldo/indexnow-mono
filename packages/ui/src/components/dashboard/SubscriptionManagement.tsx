'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge,
  Skeleton
} from '../..'
import { CreditCard, Zap, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

interface SubscriptionManagementProps {
  subscription: {
    package_id: string
    package_name: string
    status: string
    current_period_end: string
    cancel_at_period_end: boolean
    price: number
    currency: string
    interval: string
  } | null
  usage: {
    keywords_used: number
    keywords_limit: number
    is_unlimited: boolean
  } | null
  isLoading?: boolean
  onManageSubscription?: () => void
  onUpgradePlan?: () => void
}

export const SubscriptionManagement = ({
  subscription,
  usage,
  isLoading = false,
  onManageSubscription,
  onUpgradePlan
}: SubscriptionManagementProps) => {
  
  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const isCanceled = subscription?.cancel_at_period_end
  const statusColor = subscription?.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
  
  const keywordsPercentage = usage?.is_unlimited 
    ? 0 
    : Math.round(((usage?.keywords_used || 0) / (usage?.keywords_limit || 1)) * 100)

  return (
    <Card className="border-border overflow-hidden" data-testid="card-subscription-management">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Subscription & Billing</CardTitle>
          </div>
          {subscription && (
            <Badge variant="outline" className={statusColor} data-testid="badge-subscription-status">
              {subscription.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Current Plan Section */}
        {subscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/20">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground" data-testid="text-plan-name">
                  {subscription.package_name}
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {subscription.interval === 'year' ? 'Annual' : 'Monthly'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {isCanceled ? (
                  <span className="text-warning">Ends on {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}</span>
                ) : (
                  <span>Renews on {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[140px]">
              <div className="text-right sm:text-right">
                <span className="text-2xl font-bold text-foreground" data-testid="text-plan-price">
                  {subscription.currency === 'usd' ? '$' : ''}{subscription.price}
                </span>
                <span className="text-sm text-muted-foreground">/{subscription.interval}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onManageSubscription}
                data-testid="button-manage-billing"
              >
                Manage Billing
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">No active subscription</h4>
              <p className="text-sm text-muted-foreground">Choose a plan to start tracking your keyword rankings.</p>
            </div>
            <Button onClick={onUpgradePlan} data-testid="button-view-plans">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Usage Quota Section */}
        {usage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Keyword Quota</div>
                <div className="text-xs text-muted-foreground">Total keywords tracked across all domains</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground" data-testid="text-usage-ratio">
                  {usage.is_unlimited ? 'Unlimited' : `${usage.keywords_used.toLocaleString()} / ${usage.keywords_limit.toLocaleString()}`}
                </div>
                {!usage.is_unlimited && (
                  <div className="text-xs text-muted-foreground">{100 - keywordsPercentage}% remaining</div>
                )}
              </div>
            </div>
            
            {!usage.is_unlimited && (
              <div className="space-y-1.5">
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      keywordsPercentage > 90 ? 'bg-destructive' : keywordsPercentage > 75 ? 'bg-warning' : 'bg-primary'
                    }`}
                    style={{ width: `${keywordsPercentage}%` }}
                    data-testid="bar-usage-progress"
                  />
                </div>
                {keywordsPercentage > 85 && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Running low on keywords. Upgrade your plan for more.
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-border">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">Track Unlimited Domains</div>
                  <div className="text-[10px] text-muted-foreground">No limits on number of websites</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-border">
                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-info">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">Daily Rank Updates</div>
                  <div className="text-[10px] text-muted-foreground">Automatic checks every 24 hours</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Call to Action */}
        {subscription && !usage?.is_unlimited && (
          <div className="pt-2">
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md"
              onClick={onUpgradePlan}
              data-testid="button-upgrade-plan"
            >
              Upgrade Your Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
