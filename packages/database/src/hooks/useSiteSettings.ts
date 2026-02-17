/**
 * React Hook for Site Settings
 * Provides reactive site configuration from admin panel
 */

"use client";

import { useState, useEffect } from 'react'

import { logger } from '@indexnow/shared'
import { siteSettingsService, type SiteSettings } from '../utils/site-settings'

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        const siteSettings = await siteSettingsService.getSiteSettings()
        if (isMounted) setSettings(siteSettings)
      } catch (err) {
        if (!isMounted) return
        const errorMessage = err instanceof Error ? err.message : 'Failed to load site settings';
        setError(errorMessage)
        logger.error({ error: err instanceof Error ? err : undefined }, 'Site settings hook error')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSettings()
    return () => { isMounted = false }
  }, [])

  const refreshSettings = async () => {
    siteSettingsService.clearCache()
    const siteSettings = await siteSettingsService.getSiteSettings()
    setSettings(siteSettings)
  }

  return {
    settings,
    loading,
    error,
    refreshSettings
  }
}

export function useSiteLogo(isExpanded: boolean = true) {
  const [logoUrl, setLogoUrl] = useState<string>('')
  
  useEffect(() => {
    let isMounted = true
    const fetchLogo = async () => {
      const url = await siteSettingsService.getLogoUrl(isExpanded)
      if (isMounted) setLogoUrl(url)
    }
    fetchLogo()
    return () => { isMounted = false }
  }, [isExpanded])

  return logoUrl
}

export function useSiteName() {
  const [siteName, setSiteName] = useState<string>('')
  
  useEffect(() => {
    let isMounted = true
    const fetchName = async () => {
      const name = await siteSettingsService.getSiteName()
      if (isMounted) setSiteName(name)
    }
    fetchName()
    return () => { isMounted = false }
  }, [])

  return siteName
}

export function useFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string>('')
  
  useEffect(() => {
    let isMounted = true
    const fetchFavicon = async () => {
      const url = await siteSettingsService.getFaviconUrl()
      if (!isMounted) return
      setFaviconUrl(url)
      
      // Update favicon in document head
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = url
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    fetchFavicon()
    return () => { isMounted = false }
  }, [])

  return faviconUrl
}