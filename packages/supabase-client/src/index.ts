// Supabase Browser Client
// SECURITY: Only the singleton instances are exported. Factory functions
// (createBrowserClient, getBrowserClient) are internal — no consumer needs them.
// Consumers should use authService/authenticatedFetch for all operations.
// The raw client is exported ONLY for allowed SDK methods:
//   onAuthStateChange(), getSession(), setSession(), signOut({ scope: 'local' })
export {
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
