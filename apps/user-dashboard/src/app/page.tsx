'use client';

import { Suspense, useMemo } from 'react';
import { Search, TrendingUp, Globe, BarChart3 } from 'lucide-react';

import { useSubscriptionNotifications } from '../hooks/useSubscriptionNotifications';
import { useDashboardPageData } from '../hooks/useDashboardPageData';
import { NoPlanSection, EmptyDomainsState, DashboardErrorState } from '../components/dashboard';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { KeywordsTable } from '../components/dashboard/KeywordsTable';
import { QuickActionsGrid } from '../components/dashboard/QuickActionsGrid';
import { PlanUsageCard } from '../components/dashboard/PlanUsageCard';
import { PositionDistribution } from '../components/dashboard/PositionDistribution';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import type { KeywordData } from '../components/dashboard/types';

function DashboardContent() {
  // Handle subscription URL parameter toasts
  useSubscriptionNotifications();

  // All dashboard state, data processing, and actions
  const {
    domains,
    userProfile,
    packagesData,
    subscribing,
    startingTrial,
    trialEligible,
    dashboardError,
    isDataLoading,
    hasActivePackage,
    domainKeywords,
    handleSubscribe,
    handleStartTrial,
    isTrialEligiblePackage,
    calculatePositionChange,
  } = useDashboardPageData();

  // Computed stats
  const stats = useMemo(() => {
    const totalKeywords = domainKeywords.length;
    const avgPosition = totalKeywords > 0
      ? domainKeywords.reduce((sum: number, kw: KeywordData) => {
          const pos = kw.recent_ranking?.position ?? kw.current_position ?? 0;
          return sum + pos;
        }, 0) / totalKeywords
      : null;

    const top10Count = domainKeywords.filter((kw: KeywordData) => {
      const pos = kw.recent_ranking?.position ?? kw.current_position ?? 999;
      return pos <= 10;
    }).length;

    // Calculate improved count based on position changes
    let improvedCount = 0;
    for (const kw of domainKeywords) {
      const change = calculatePositionChange(kw);
      if (change !== null && change > 0) improvedCount++;
    }

    return { totalKeywords, avgPosition, top10Count, improvedCount };
  }, [domainKeywords, calculatePositionChange]);

  // Plan info for PlanUsageCard
  const planInfo = useMemo(() => {
    const profileRecord = userProfile as unknown as Record<string, unknown> | null;
    if (!profileRecord?.package) return null;

    const pkg = profileRecord.package as Record<string, unknown>;
    const quotaLimits = pkg.quota_limits as Record<string, number> | undefined;

    return {
      name: (pkg.name as string) || 'Unknown Plan',
      slug: (pkg.slug as string) || '',
      keywordsLimit: quotaLimits?.keywords_limit ?? 0,
      keywordsUsed: (profileRecord.keywords_used as number) ?? 0,
      dailyChecksLimit: quotaLimits?.concurrent_jobs ?? 0,
      dailyChecksUsed: (profileRecord.active_jobs_count as number) ?? 0,
      isTrial: !!(profileRecord as Record<string, unknown>).is_trial,
      expiresAt: (profileRecord.expires_at as string) ?? null,
    };
  }, [userProfile]);

  // Loading state
  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (dashboardError && !isDataLoading) {
    return (
      <DashboardErrorState
        message={dashboardError.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* No Active Package — show pricing */}
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

      {/* Empty State — No Domains */}
      {hasActivePackage && domains.length === 0 ? <EmptyDomainsState /> : null}

      {/* Main Dashboard */}
      {hasActivePackage && domains.length > 0 && (
        <>
          {/* Welcome Header */}
          <WelcomeHeader
            userName={userProfile?.full_name ?? null}
            domainCount={domains.length}
            keywordCount={stats.totalKeywords}
            avgPosition={stats.avgPosition}
          />

          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Keywords"
              value={stats.totalKeywords}
              icon={<Search className="w-4 h-4" />}
              variant="default"
            />
            <StatCard
              label="Avg. Position"
              value={stats.avgPosition !== null ? stats.avgPosition.toFixed(1) : '—'}
              icon={<TrendingUp className="w-4 h-4" />}
              variant="success"
            />
            <StatCard
              label="Top 10 Rankings"
              value={stats.top10Count}
              icon={<Globe className="w-4 h-4" />}
              variant="warning"
            />
            <StatCard
              label="Improved"
              value={stats.improvedCount}
              icon={<BarChart3 className="w-4 h-4" />}
              variant="default"
            />
          </div>

          {/* Two-column layout: Keywords Table + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Keywords Table */}
            <div className="lg:col-span-2">
              <KeywordsTable
                keywords={domainKeywords}
                title="Tracked Keywords"
                maxRows={8}
                showViewAll={domainKeywords.length > 8}
              />
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <PlanUsageCard plan={planInfo} />
              <PositionDistribution keywords={domainKeywords} />
              <QuickActionsGrid />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
