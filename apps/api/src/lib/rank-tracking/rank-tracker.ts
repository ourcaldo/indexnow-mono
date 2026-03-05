import { firecrawlRateLimiter } from './firecrawl-rate-limiter'
import { logger } from '../monitoring/error-handling'
import { ApiKeyManager } from './api-key-manager'

export interface RankResult {
  position: number | null
  url: string | null
  title: string | null
  keyword: string
  device: string
  country: string
  foundInTop100: boolean
  error?: string
}

/** HTTP status codes that indicate an invalid/exhausted API key */
const KEY_FAILURE_STATUSES = new Set([401, 403])

export class RankTracker {
  /**
   * Perform a rank check using Firecrawl API
   */
  static async checkRank(
    keyword: string,
    targetDomain: string,
    country: string = 'us',
    device: 'desktop' | 'mobile' = 'desktop'
  ): Promise<RankResult> {
    const keyResult = await ApiKeyManager.getActiveKeyWithId('firecrawl')
    if (!keyResult) {
      throw new Error('No active Firecrawl API key found')
    }

    // Wait for rate limit slot
    const acquired = await firecrawlRateLimiter.acquireSlot(keyResult.apiKey)
    if (!acquired) {
      throw new Error('Firecrawl API rate limit wait timeout')
    }

    try {
      logger.info({ keyword, targetDomain, country, device }, 'Performing rank check')

      // Call Firecrawl API (v2 Search endpoint)
      const response = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyResult.apiKey}`,
        },
        body: JSON.stringify({
          query: keyword,
          limit: 100,
          location: country,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Auto-disable key on auth failures (401/403)
        if (KEY_FAILURE_STATUSES.has(response.status)) {
          await ApiKeyManager.markKeyFailed(
            'firecrawl',
            keyResult.id,
            `API returned ${response.status}: ${JSON.stringify(errorData)}`
          )
        }

        throw new Error(`Firecrawl API error: ${response.status} ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      // v2 response: { success: true, data: { web: [...], images: [...], news: [...] } }
      const results = (data.data?.web) || []

      // Find target domain in results; v2 results include a `position` field
      let position = -1
      let foundUrl = null
      let foundTitle = null

      for (const result of results) {
        const url = result.url || ''
        if (url.toLowerCase().includes(targetDomain.toLowerCase())) {
          position = result.position ?? (results.indexOf(result) + 1)
          foundUrl = url
          foundTitle = result.title
          break
        }
      }

      return {
        position: position > 0 ? position : null,
        url: foundUrl,
        title: foundTitle,
        keyword,
        device,
        country,
        foundInTop100: position > 0,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error({ errorMessage, keyword, targetDomain }, 'Rank check failed')
      throw error
    }
  }
}
