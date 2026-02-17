// Supabase Browser Client
export {
  createBrowserClient,
  getBrowserClient,
  supabaseBrowser,
  supabase,
} from './supabase-browser'

// Auth Service
export {
  AuthService,
  authService,
  type AuthUser,
} from './auth-service'

// Authenticated Fetch
export {
  authenticatedFetch,
  authenticatedFetchJson,
  type AuthenticatedFetchOptions,
} from './authenticated-fetch'
