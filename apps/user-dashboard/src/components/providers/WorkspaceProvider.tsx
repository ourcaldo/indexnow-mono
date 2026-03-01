'use client'

import { createContext, useContext, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDomains, useProfile, useUpdateActiveDomain, type Domain } from '../../lib/hooks'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceContextValue {
  /** Active domain name (e.g. "example.com") — null means "all workspaces" */
  activeDomain: string | null
  /** Full domain object for the active domain, or null */
  activeDomainInfo: Domain | null
  /** All domains belonging to the user */
  domains: Domain[]
  /** True while domains or profile are loading */
  isLoading: boolean
  /** Switch the active workspace. Pass null to clear (show all). */
  setActiveDomain: (domainName: string | null) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeDomain: null,
  activeDomainInfo: null,
  domains: [],
  isLoading: true,
  setActiveDomain: () => {},
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { data: domains = [], isLoading: domainsLoading } = useDomains()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateActiveDomain = useUpdateActiveDomain()

  // Priority: ?domain= URL param → profile.active_domain → null (all)
  const urlDomain = searchParams.get('domain')
  const activeDomain = urlDomain ?? profile?.active_domain ?? null

  const activeDomainInfo = useMemo(
    () => domains.find(d => d.domain_name === activeDomain) ?? null,
    [domains, activeDomain]
  )

  const setActiveDomain = useCallback(
    (domainName: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (domainName) {
        params.set('domain', domainName)
      } else {
        params.delete('domain')
      }
      const search = params.toString()
      router.replace(`${pathname}${search ? '?' + search : ''}`)
      // Fire-and-forget — persist to profile so it survives page refresh
      updateActiveDomain.mutate(domainName)
    },
    [pathname, searchParams, router, updateActiveDomain]
  )

  return (
    <WorkspaceContext.Provider
      value={{
        activeDomain,
        activeDomainInfo,
        domains,
        isLoading: domainsLoading || profileLoading,
        setActiveDomain,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useWorkspace = () => useContext(WorkspaceContext)
