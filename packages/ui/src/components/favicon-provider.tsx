'use client'

import { useFavicon } from '@indexnow/database'

/**
 * Client-side component that automatically updates the favicon
 * across all pages using the site settings from /api/v1/public/settings
 */
export function FaviconProvider() {
  useFavicon() // Automatically fetches and updates favicon
  return null // This component only handles the favicon side effect
}
