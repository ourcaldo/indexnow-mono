'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { type RankTrackingDomain, type DashboardRecentKeyword } from '@indexnow/shared'

interface DomainContextType {
  domains: RankTrackingDomain[]
  selectedDomainId: string | null
  selectedDomainInfo: RankTrackingDomain | undefined
  setSelectedDomainId: (id: string) => void
  getDomainKeywordCount: (domainId: string) => number
  isDomainSelectorOpen: boolean
  setIsDomainSelectorOpen: (isOpen: boolean) => void
  isLoading: boolean
}

const DomainContext = createContext<DomainContextType | undefined>(undefined)

export function DomainProvider({ children }: { children: ReactNode }) {
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
  const [isDomainSelectorOpen, setIsDomainSelectorOpen] = useState(false)

  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData()
  const domains = dashboardData?.rankTracking?.domains || []
  const recentKeywords = dashboardData?.rankTracking?.recentKeywords || []

  useEffect(() => {
    if (!selectedDomainId && domains.length > 0) {
      setSelectedDomainId(domains[0].id)
    }
  }, [domains, selectedDomainId])

  const selectedDomainInfo = domains.find((d: RankTrackingDomain) => d.id === selectedDomainId)

  const getDomainKeywordCount = (domainId: string) => {
    return recentKeywords.filter((k: DashboardRecentKeyword) => k.domain?.id === domainId).length
  }

  return (
    <DomainContext.Provider
      value={{
        domains,
        selectedDomainId,
        selectedDomainInfo,
        setSelectedDomainId,
        getDomainKeywordCount,
        isDomainSelectorOpen,
        setIsDomainSelectorOpen,
        isLoading: dashboardLoading
      }}
    >
      {children}
    </DomainContext.Provider>
  )
}

export function useDomain() {
  const context = useContext(DomainContext)
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider')
  }
  return context
}
