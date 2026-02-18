import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ADMIN_ENDPOINTS, type SiteSettingsRow, logger } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';

export type UI_SiteSettings = SiteSettingsRow & {
  robots_txt_content?: string;
  site_tagline?: string | null;
  white_logo?: string | null;
};

async function fetchSiteSettings(): Promise<UI_SiteSettings | null> {
  const response = await authenticatedFetch(ADMIN_ENDPOINTS.SITE_SETTINGS);

  if (!response.ok) {
    throw new Error('Failed to fetch site settings');
  }

  const data = await response.json();
  return data.data?.settings ?? null;
}

export function useAdminSiteSettings(): UseQueryResult<UI_SiteSettings | null, Error> {
  return useQuery({
    queryKey: ['admin', 'settings', 'site'],
    queryFn: fetchSiteSettings,
  });
}

export function useSaveSiteSettings(): UseMutationResult<unknown, Error, UI_SiteSettings> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: UI_SiteSettings) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.SITE_SETTINGS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save site settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'site'] });
    },
    onError: (error) => {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Failed to save site settings'
      );
    },
  });
}

export function useTestEmail(): UseMutationResult<unknown, Error, Record<string, unknown>> {
  return useMutation({
    mutationFn: async (emailConfig: Record<string, unknown>) => {
      const response = await authenticatedFetch(ADMIN_ENDPOINTS.TEST_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }
      return response.json();
    },
  });
}
