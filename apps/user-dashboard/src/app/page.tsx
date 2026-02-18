'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  LegacyRankingDistribution as RankingDistribution,
  ActivityTimeline,
} from '@indexnow/ui/dashboard';

import { useSubscriptionNotifications } from '../hooks/useSubscriptionNotifications';
import { useDashboardPageData } from '../hooks/useDashboardPageData';
import {
  PerformanceOverview,
  TopKeywordsTable,
  QuickActions,
  NoPlanSection,
  EmptyDomainsState,
  DashboardErrorState,
  DashboardLoadingSkeleton,
} from '../components/dashboard';

function DashboardContent() {
  const router = useRouter();

  // Handle subscription URL parameter toasts
  useSubscriptionNotifications();

  // All dashboard state, data processing, and actions
  const {
    domains,
    selectedDomain,
    userProfile,
    packagesData,
    subscribing,
    startingTrial,
    trialEligible,
    dashboardError,
    isDataLoading,
    hasActivePackage,
    domainKeywords,
    rankingData,
    activityData,
    handleSubscribe,
    handleStartTrial,
    isTrialEligiblePackage,
    calculatePositionChange,
  } = useDashboardPageData();

  // Runtime domain objects from Supabase have DB column names (display_name, domain_name)
  // which differ from the RankTrackingDomain TS interface (name, domain).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const domainAny = selectedDomain as any;
  const selectedDomainName =
    domainAny?.display_name || domainAny?.domain_name || selectedDomain?.name || '';

  return (
    <div className="space-y-6">
      {/* Dashboard Error State */}
      {dashboardError && !isDataLoading ? (
        <DashboardErrorState
          message={dashboardError.message}
          onRetry={() => window.location.reload()}
        />
      ) : null}

      {/* No Active Package / Loading State */}
      <NoPlanSection
        isDataLoading={isDataLoading}
        hasActivePackage={hasActivePackage}
        packagesData={packagesData}
        subscribing={subscribing}
        startingTrial={startingTrial}
        trialEligible={trialEligible}
        onSubscribe={handleSubscribe}
        onStartTrial={handleStartTrial}
        isTrialEligiblePackage={isTrialEligiblePackage}
      />

      {/* Empty State - No Domains */}
      {hasActivePackage && domains.length === 0 ? <EmptyDomainsState /> : null}

      {/* Main Dashboard Content */}
      {hasActivePackage && domains.length > 0 && (
        <>
          <PerformanceOverview
            domainKeywords={domainKeywords}
            selectedDomainName={selectedDomainName}
            keywordsUsed={userProfile?.keywords_used || 0}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content Area */}
            <div className="space-y-6 lg:col-span-2">
              <RankingDistribution
                data={rankingData}
                title="Position Distribution"
                description="See where your keywords rank"
                className="w-full"
              />

              <TopKeywordsTable
                domainKeywords={domainKeywords}
                selectedDomainName={selectedDomainName}
                calculatePositionChange={calculatePositionChange}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <QuickActions domainKeywordsCount={domainKeywords.length} />

              <ActivityTimeline
                activities={activityData}
                title="Recent Activity"
                description="Latest updates and changes"
                maxItems={3}
                showViewAll={true}
                showUpdateBadge={false}
                onViewAll={() => router.push('/dashboard/indexnow/rank-history')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
