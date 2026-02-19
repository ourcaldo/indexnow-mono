'use client';

import { useState, useEffect, useMemo } from 'react';
import { logger } from '@indexnow/shared';
import type { AppUserProfile, TrialEligibility, UserSubscription } from '@indexnow/shared';
import { usePageViewLogger, useActivityLogger, useDashboardData } from '@indexnow/ui/hooks';
import { useDomain } from '@indexnow/ui/contexts';
import type { ActivityItem } from '@indexnow/ui/dashboard';
import type { DashboardRecentKeyword } from '@indexnow/shared';
import type { KeywordData, PaymentPackage } from '../components/dashboard/types';

/** Matches the shape accepted by LegacyRankingDistribution */
interface RankingDataItem {
  position: number | null;
  keyword: string;
  domain: string;
}

/** M-08: proper mapping from API type to local KeywordData (no double-cast). */
function toKeywordData(src: DashboardRecentKeyword): KeywordData {
  const latestRanking = Array.isArray(src.recent_ranking) ? src.recent_ranking[0] : undefined;
  return {
    id: src.id,
    keyword: src.keyword,
    current_position: latestRanking?.position ?? null,
    position_1d: null,
    position_3d: null,
    position_7d: null,
    domain: {
      id: src.domain?.id,
      display_name: src.domain?.display_name ?? src.domain?.domain_name ?? '',
      domain_name: src.domain?.domain_name ?? '',
    },
    device_type: src.device_type,
    country: {
      name: src.country?.name ?? '',
      iso2_code: src.country?.iso2_code ?? '',
    },
    recent_ranking: latestRanking ? { position: latestRanking.position } : undefined,
    tags: [],
  };
}

export function useDashboardPageData() {
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [packagesData, setPackagesData] = useState<UserSubscription | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState<string | null>(null);
  const [trialEligible, setTrialEligible] = useState<TrialEligibility | null>(null);

  // Log page view and dashboard activities
  usePageViewLogger('/dashboard', 'Dashboard', { section: 'main_dashboard' });
  const { logDashboardActivity } = useActivityLogger();

  // Use domain context for domain-related state and data
  const {
    domains,
    selectedDomainId,
    selectedDomainInfo: selectedDomain,
    setSelectedDomainId,
    getDomainKeywordCount,
    isDomainSelectorOpen,
    setIsDomainSelectorOpen,
  } = useDomain();

  // Use merged dashboard data for user and billing info
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  // Extract data from merged dashboard endpoint
  const recentKeywords: KeywordData[] = (dashboardData?.rankTracking?.recentKeywords ?? []).map(
    toKeywordData
  );

  // Filter keywords by selected domain
  const getKeywordsForDomain = (domainId: string | null): KeywordData[] => {
    if (!domainId) return [];
    return recentKeywords.filter((k) => k.domain?.id === domainId) || [];
  };

  const domainKeywords = getKeywordsForDomain(selectedDomainId);

  // Handle subscription
  const handleSubscribe = async (packageId: string, period: string) => {
    try {
      setSubscribing(packageId);
      const checkoutUrl = `/dashboard/settings/plans-billing/checkout?package=${packageId}&period=${period}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Error starting subscription'
      );
    } finally {
      setSubscribing(null);
    }
  };

  // Check if package is eligible for trial
  const isTrialEligiblePackage = (pkg: PaymentPackage) => {
    return pkg.free_trial_enabled === true;
  };

  // Handle trial subscription
  const handleStartTrial = async (packageId: string) => {
    try {
      setStartingTrial(packageId);
      const checkoutUrl = `/dashboard/settings/plans-billing/checkout?package=${packageId}&period=monthly&trial=true`;
      window.location.href = checkoutUrl;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error starting trial');
    } finally {
      setStartingTrial(null);
    }
  };

  // Process dashboard data when it loads
  useEffect(() => {
    if (dashboardData && !dashboardLoading) {
      if (dashboardData.user?.profile) {
        setUserProfile(dashboardData.user.profile);
      }

      if (dashboardData.billing) {
        setPackagesData(dashboardData.billing);
      }

      if (dashboardData.user?.trial !== undefined) {
        setTrialEligible(dashboardData.user.trial);
      }

      setLoading(false);

      logDashboardActivity(
        'dashboard_data_loaded_from_merged_api',
        'Dashboard data loaded from merged endpoint',
        {
          timestamp: new Date().toISOString(),
          has_user_data: !!dashboardData.user,
          has_billing_data: !!dashboardData.billing,
          has_rank_tracking_data: !!dashboardData.rankTracking,
        }
      );
    }
  }, [dashboardData, dashboardLoading, logDashboardActivity]);

  // Handle dashboard loading errors
  useEffect(() => {
    if (dashboardError) {
      logDashboardActivity('dashboard_data_error', 'Dashboard merged API error', {
        error: dashboardError.message,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, [dashboardError, logDashboardActivity]);

  const rankingData = useMemo((): RankingDataItem[] => {
    return domainKeywords.map((keyword: KeywordData) => ({
      position: keyword.recent_ranking?.position || null,
      keyword: keyword.keyword,
      domain: keyword.domain.display_name || keyword.domain.domain_name,
    }));
  }, [domainKeywords]);

  const activityData = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Generate stable activities based on keyword data
    domainKeywords.slice(0, 3).forEach((keyword: KeywordData, index) => {
      if (keyword.recent_ranking?.position) {
        const activityTime = new Date(now.getTime() - (index + 1) * 2 * 60 * 60 * 1000);

        activities.push({
          id: `activity_${keyword.id}_${index}`,
          type: keyword.recent_ranking.position <= 10 ? 'rank_improved' : 'rank_declined',
          title: `${keyword.keyword} ranking updated`,
          description: `New position: #${keyword.recent_ranking.position}`,
          timestamp: activityTime.toISOString(),
          metadata: {
            keyword: keyword.keyword,
            domain: keyword.domain.display_name,
            position: keyword.recent_ranking.position,
          },
        });
      }
    });

    // Add generic domain activity
    if (domainKeywords.length > 0) {
      const domainActivityTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      activities.push({
        id: `activity_domain_${selectedDomainId}`,
        type: 'domain_added',
        title: 'Domain monitoring active',
        description: `Tracking ${domainKeywords.length} keywords`,
        timestamp: domainActivityTime.toISOString(),
        metadata: {
          domain: domains.find((d) => d.id === selectedDomainId)?.name || 'Domain',
        },
      });
    }

    return activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [domainKeywords, selectedDomainId, domains]);

  const hasActivePackage = userProfile?.package || packagesData?.current_package_id;
  const isDataLoading = loading || dashboardLoading;

  // Calculate actual position changes for keywords
  const calculatePositionChange = (keyword: KeywordData): number | null => {
    const current = keyword.recent_ranking?.position || keyword.current_position;
    if (!current) return null;

    // Try to find historical data for comparison
    const historical = keyword.position_1d || keyword.position_3d || keyword.position_7d;
    if (!historical) return null;

    // Position improvement means lower number (better ranking)
    return historical - current;
  };

  return {
    // Domain data
    domains,
    selectedDomainId,
    selectedDomain,
    setSelectedDomainId,
    getDomainKeywordCount,
    isDomainSelectorOpen,
    setIsDomainSelectorOpen,

    // User data
    userProfile,

    // Package/billing data
    packagesData,
    subscribing,
    startingTrial,
    trialEligible,

    // Dashboard query state
    dashboardError,
    isDataLoading,
    hasActivePackage,

    // Keyword data
    domainKeywords,
    rankingData,
    activityData,

    // Actions
    handleSubscribe,
    handleStartTrial,
    isTrialEligiblePackage,
    calculatePositionChange,
  };
}
