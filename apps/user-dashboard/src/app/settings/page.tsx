'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

const tabToRoute: Record<string, string> = {
  profile: '/settings/profile',
  security: '/settings/security',
  notifications: '/settings/notifications',
  billing: '/settings/billing',
  general: '/settings/profile',
  'plans-billing': '/settings/billing',
  plans: '/settings/billing',
}

function SettingsRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const tab = searchParams?.get('tab')
    const route = tab ? tabToRoute[tab] : undefined
    router.replace(route ?? '/settings/profile')
  }, [searchParams, router])

  return <div className="animate-pulse h-8 w-32 rounded bg-gray-200" />
}

/** Redirect /settings â†’ /settings/profile and handle legacy ?tab= params */
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-8 w-32 rounded bg-gray-200" />}>
      <SettingsRedirect />
    </Suspense>
  )
}
