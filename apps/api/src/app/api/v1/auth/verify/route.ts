import { authenticatedApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware'

export const GET = authenticatedApiWrapper(async (request, auth) => {
  return formatSuccess({ 
    message: 'Auth verify endpoint',
    userId: auth.userId,
    email: auth.user?.email,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin
  })
})
