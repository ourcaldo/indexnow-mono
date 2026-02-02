import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { adminApiWrapper, formatSuccess, formatError } from '@/lib/core/api-response-middleware'
import { ErrorHandlingService, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handling'

const revalidateSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  secret: z.string().optional()
})

export const POST = adminApiWrapper(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = revalidateSchema.safeParse({
      path: searchParams.get('path'),
      secret: searchParams.get('secret')
    })

    if (!validation.success) {
      const validationError = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        validation.error.issues[0].message,
        { severity: ErrorSeverity.LOW, userId: auth.userId, statusCode: 400 }
      )
      return formatError(validationError)
    }

    const { path, secret } = validation.data

    // Check if it's a super admin or if a valid secret is provided
    if (!auth.isSuperAdmin) {
      const expectedSecret = process.env.REVALIDATE_SECRET
      if (!expectedSecret || secret !== expectedSecret) {
        const authError = await ErrorHandlingService.createError(
          ErrorType.AUTHORIZATION,
          'Unauthorized to revalidate',
          { severity: ErrorSeverity.MEDIUM, userId: auth.userId, statusCode: 403 }
        )
        return formatError(authError)
      }
    }

    // Revalidate the specified path
    revalidatePath(path)
    
    return formatSuccess({
      message: `Revalidated ${path}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const systemError = await ErrorHandlingService.createError(
      ErrorType.SYSTEM,
      error instanceof Error ? error.message : String(error),
      { severity: ErrorSeverity.HIGH, userId: auth.userId, statusCode: 500 }
    )
    return formatError(systemError)
  }
})

export const GET = POST