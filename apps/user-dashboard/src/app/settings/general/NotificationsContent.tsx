'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useActivityLogger } from '@indexnow/ui/hooks'
import { useToast, ToggleSwitch } from '@indexnow/ui'
import { AUTH_ENDPOINTS } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'
import { Loader2 } from 'lucide-react'
import { useUserSettings } from '../../../lib/hooks'

export default function NotificationsContent() {
  const { addToast } = useToast()
  const { logDashboardActivity } = useActivityLogger()
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading: loading } = useUserSettings()

  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    jobCompletion: true,
    failures: true,
    dailyReports: true,
    criticalAlerts: true,
  })

  // Sync local form state from React Query data
  useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings
      setNotifications({
        jobCompletion: !!s.email_job_completion,
        failures: !!s.email_job_failure,
        dailyReports: !!s.email_daily_report,
        criticalAlerts: !!s.email_quota_alerts,
      })
    }
  }, [settingsData])

  const save = async () => {
    try {
      setSaving(true)
      const res = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify({
          email_job_completion: notifications.jobCompletion,
          email_job_failure: notifications.failures,
          email_daily_report: notifications.dailyReports,
          email_quota_alerts: notifications.criticalAlerts,
        }),
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['user-settings'] })
        addToast({ title: 'Saved', description: 'Notification preferences updated', type: 'success' })
        await logDashboardActivity('settings_update', 'Notification settings updated', {
          section: 'notifications',
          changes: { notifications },
        })
      } else {
        const err = await res.json()
        addToast({ title: 'Error', description: err.error || 'Something went wrong', type: 'error' })
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to update settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded bg-gray-100" />
        ))}
      </div>
    )
  }

  const items = [
    { key: 'jobCompletion' as const, label: 'Rank tracking', desc: 'When tracking checks complete' },
    { key: 'failures' as const, label: 'Failure alerts', desc: 'Immediate notifications for failed jobs' },
    { key: 'dailyReports' as const, label: 'Daily digest', desc: 'Summary of your account activity' },
    { key: 'criticalAlerts' as const, label: 'Quota warnings', desc: 'When approaching usage limits' },
  ]

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 first:pt-0">
            <div className="pr-3">
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ToggleSwitch
              checked={notifications[item.key]}
              onChange={(v) => setNotifications((p) => ({ ...p, [item.key]: v }))}
              testId={`switch-${item.key}`}
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        data-testid="button-save-notifications"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? 'Savingâ€¦' : 'Save preferences'}
      </button>
    </div>
  )
}
