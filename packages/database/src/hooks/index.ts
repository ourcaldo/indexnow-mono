// Database Hooks - Only hooks that directly use database services remain here
// All API-fetch hooks have been moved to @indexnow/ui package

// Site Settings - Uses database service layer (siteSettingsService)
export {
  useSiteSettings,
  useSiteLogo,
  useSiteName,
  useFavicon
} from './useSiteSettings'