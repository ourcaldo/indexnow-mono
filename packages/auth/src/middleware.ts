import { 
    createMiddlewareClient, 
    type MiddlewareRequest, 
    type MiddlewareResponseFactory 
} from '@indexnow/database/client'

/**
 * Helper to get user from middleware client
 * Uses the implementation from @indexnow/database
 */
export async function getUser<TRequest extends MiddlewareRequest>(
    request: TRequest,
    ResponseFactory: MiddlewareResponseFactory
) {
    const { supabase, response } = createMiddlewareClient(request, ResponseFactory)
    const { data: { user }, error } = await supabase.auth.getUser()

    return { user, error, response, supabase }
}
