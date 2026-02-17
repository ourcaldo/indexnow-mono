// Client-safe exports only — do NOT import server-only or Node.js crypto modules here.
// For server-only auth (requireServerAdminAuth, encryption, etc.), use:
//   import { ... } from '@indexnow/auth/server'

export * from './auth-error-handler'
export * from './contexts/AuthContext'
export * from './hooks/useSessionRefresh'
export * from './middleware'

// Re-export AdminUser type only (types are safe for client bundles)
export type { AdminUser, ServerAdminUser } from './server-auth'
