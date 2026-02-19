'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, PricingTable } from '@indexnow/ui';

// (#V7 L-21) Props use `any` for hasActivePackage, packagesData, trialEligible,
// and isTrialEligiblePackage because these come from a dynamic API response
// (PlansBillingContent) and typing them fully would couple this component
// to the billing API shape. Consider creating a BillingContext type.
export interface NoPlanSectionProps {
  isDataLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasActivePackage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packagesData: any;
  subscribing: string | null;
  startingTrial: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trialEligible: any;
  onSubscribe: (packageId: string, period: string) => void;
  onStartTrial: (packageId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isTrialEligiblePackage: (pkg: any) => boolean;
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-border rounded-lg border p-6">
                <Skeleton className="mb-4 h-6 w-24" />
                <Skeleton className="mb-4 h-8 w-16" />
                <div className="mb-6 space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NoPlanSection({
  isDataLoading,
  hasActivePackage,
  packagesData,
  subscribing,
  startingTrial,
  trialEligible,
  onSubscribe,
  onStartTrial,
  isTrialEligiblePackage,
}: NoPlanSectionProps) {
  if (isDataLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (hasActivePackage || !packagesData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Unlock the Power of Professional Rank Tracking</CardTitle>
        <p className="text-muted-foreground text-lg">
          Subscribe to start tracking your keyword rankings, monitor your SEO performance, and grow
          your online presence with professional insights.
        </p>
      </CardHeader>
      <CardContent>
        <PricingTable
          showTrialButton={true}
          trialEligible={trialEligible || false}
          currentPackageId={packagesData.current_package_id}
          subscribing={subscribing}
          startingTrial={startingTrial}
          onSubscribe={onSubscribe}
          onStartTrial={onStartTrial}
          isTrialEligiblePackage={isTrialEligiblePackage}
        />
      </CardContent>
    </Card>
  );
}
