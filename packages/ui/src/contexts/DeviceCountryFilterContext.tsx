'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiEndpoints, authenticatedFetch } from '@indexnow/shared'

/** @internal Not yet consumed by any app — reserved for future use */
interface Country {
  id: string
  name: string
}

interface DeviceCountryFilterContextType {
  selectedDevice: string
  selectedCountry: string
  countries: Country[]
  setSelectedDevice: (device: string) => void
  setSelectedCountry: (country: string) => void
  isLoading: boolean
}

const DeviceCountryFilterContext = createContext<DeviceCountryFilterContextType | undefined>(undefined)

export function DeviceCountryFilterProvider({ children }: { children: ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  // Fetch countries for filter
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: [ApiEndpoints.RANK_TRACKING.COUNTRIES],
    queryFn: async () => {
      const response = await authenticatedFetch(ApiEndpoints.RANK_TRACKING.COUNTRIES)
      if (!response.ok) throw new Error('Failed to fetch countries')
      const result = await response.json()
      if (result.success === true && result.data) {
        return result.data
      }
      return result
    }
  })

  const countries = countriesData || []

  return (
    <DeviceCountryFilterContext.Provider
      value={{
        selectedDevice,
        selectedCountry,
        countries,
        setSelectedDevice,
        setSelectedCountry,
        isLoading: countriesLoading
      }}
    >
      {children}
    </DeviceCountryFilterContext.Provider>
  )
}

export function useDeviceCountryFilter() {
  const context = useContext(DeviceCountryFilterContext)
  if (context === undefined) {
    throw new Error('useDeviceCountryFilter must be used within a DeviceCountryFilterProvider')
  }
  return context
}
