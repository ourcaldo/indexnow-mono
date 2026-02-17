/**
 * Server-only auth exports.
 * Import from '@indexnow/auth/server' in Next.js API routes and server components.
 * Do NOT import this from client components or Edge middleware — it uses
 * 'server-only' and Node.js 'crypto', which are not available in those contexts.
 */

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
export * from './encryption'
