// Auth types & functions — consolidated in server-auth, re-exported via admin-auth
export { AdminAuthService, adminAuthService } from './admin-auth'
export {
  type AdminUser,
  type ServerAdminUser,
  getServerAdminUser,
  getServerAuthUser,
  requireServerAdminAuth,
  requireServerSuperAdminAuth,
  requireAdminAuth,
  requireSuperAdminAuth,
} from './server-auth'

// Backward compat: requireAdminAuth / requireSuperAdminAuth are also
// re-exported from admin-auth.ts (aliases to server-auth versions).

export * from './encryption'
export * from './auth-error-handler'
export * from './contexts/AuthContext'
export * from './hooks/useSessionRefresh'
export * from './middleware'
