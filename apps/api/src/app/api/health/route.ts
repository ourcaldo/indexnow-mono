import { publicApiWrapper, formatSuccess } from '@/lib/core/api-response-middleware'

export const GET = publicApiWrapper(async () => {
  return formatSuccess({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'IndexNow Studio API is running' 
  })
})