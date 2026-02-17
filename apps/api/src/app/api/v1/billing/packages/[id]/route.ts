import { SecureServiceRoleWrapper, supabaseAdmin, createServerClient } from '@indexnow/database';
import { NextRequest } from 'next/server'
import { ErrorType, ErrorSeverity , getClientIP} from '@indexnow/shared';
import { publicApiWrapper } from '@/lib/core/api-response-middleware'
import { formatSuccess, formatError } from '@/lib/core/api-response-formatter'
import { cookies } from 'next/headers'
import { ErrorHandlingService } from '@/lib/monitoring/error-handling'

export const GET = publicApiWrapper(async (request, context) => {
  // Get packageId from context params (Next.js 15 dynamic routes)
  const params = context?.params ? await context.params : null
  const packageId = params?.id

  if (!packageId) {
    const error = await ErrorHandlingService.createError(
      ErrorType.VALIDATION,
      'Package ID is required',
      {
        severity: ErrorSeverity.LOW,
        endpoint: '/api/v1/billing/packages/[id]',
        statusCode: 400
      }
    )
    return formatError(error)
  }

  // Get user context for optional audit tracking (public endpoint, no auth required)
  const cookieStore = await cookies()
  const userSupabaseClient = createServerClient(cookieStore)

  const { data: { user } } = await userSupabaseClient.auth.getUser()

  // Get package details using SecureWrapper
  // Use 'system' userId for public operations (package viewing is public)
  const packageData = await SecureServiceRoleWrapper.executeSecureOperation(
    {
      userId: 'system',
      operation: 'public_get_package_details',
      source: 'billing/packages',
      reason: 'Public API fetching package details for display and checkout',
      metadata: {
        packageId,
        endpoint: '/api/v1/billing/packages/[id]',
        method: 'GET',
        requestingUserId: user?.id || 'anonymous'
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    },
    { table: 'indb_payment_packages', operationType: 'select' },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('indb_payment_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error('Failed to fetch package details')
      }

      return data
    }
  )

  if (!packageData) {
    const error = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      'Resource not available',
      {
        severity: ErrorSeverity.LOW,
        userId: user?.id,
        endpoint: '/api/v1/billing/packages/[id]',
        statusCode: 404,
        metadata: { packageId, requestingUser: user?.id || 'anonymous' }
      }
    )
    return formatError(error)
  }

  return formatSuccess({
    data: packageData
  })
})

