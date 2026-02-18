'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ADMIN_ENDPOINTS,
  BILLING_ENDPOINTS,
  logger,
  type Package,
  type Json,
} from '@indexnow/shared';
import type { ActivityLog, SecurityData } from '../components';

// Extends the shared AdminUserProfile shape to match what the API returns
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  phone_number: string | null;
  package_id?: string;
  subscribed_at?: string;
  subscription_ends_at?: string;
  daily_quota_used?: number;
  daily_quota_limit?: number;
  daily_quota_reset_date?: string;
  package?: Package | null;
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  [key: string]: unknown;
}

interface UseUserDataReturn {
  user: UserProfile | null;
  activityLogs: ActivityLog[];
  securityData: SecurityData | null;
  availablePackages: Package[];
  loading: boolean;
  activityLoading: boolean;
  securityLoading: boolean;
  fetchUser: () => Promise<void>;
  fetchUserActivity: () => Promise<void>;
  fetchUserSecurity: () => Promise<void>;
}

export function useUserData(userId: string): UseUserDataReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(ADMIN_ENDPOINTS.USER_BY_ID(userId), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data?.user);
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchUserActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      const response = await fetch(`${ADMIN_ENDPOINTS.USER_BY_ID(userId)}/activity?limit=10`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.data?.logs || []);
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to fetch user activity'
      );
    } finally {
      setActivityLoading(false);
    }
  }, [userId]);

  const fetchUserSecurity = useCallback(async () => {
    try {
      setSecurityLoading(true);
      const response = await fetch(ADMIN_ENDPOINTS.USER_SECURITY(userId), {
        credentials: 'include', // Essential for cross-subdomain authentication
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityData(data.data?.security);
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to fetch user security data'
      );
    } finally {
      setSecurityLoading(false);
    }
  }, [userId]);

  const fetchAvailablePackages = useCallback(async () => {
    try {
      const response = await fetch(ADMIN_ENDPOINTS.PACKAGES, {
        credentials: 'include', // Essential for cross-subdomain authentication
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePackages(data.data?.packages || []);
      }
    } catch (error) {
      // Error already handled by API, no need to log to user console
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserActivity();
      fetchUserSecurity();
      fetchAvailablePackages();
    }
  }, [userId, fetchUser, fetchUserActivity, fetchUserSecurity, fetchAvailablePackages]);

  return {
    user,
    activityLogs,
    securityData,
    availablePackages,
    loading,
    activityLoading,
    securityLoading,
    fetchUser,
    fetchUserActivity,
    fetchUserSecurity,
  };
}
