'use client'

import { useState, useEffect } from 'react'
import { useActivityLogger } from '@indexnow/ui/hooks'
import { useToast } from '@indexnow/ui'
import { AUTH_ENDPOINTS } from '@indexnow/shared'
import { authenticatedFetch } from '@indexnow/supabase-client'
import { Loader2 } from 'lucide-react'

/* ─── Toggle Switch ─── */
function Toggle({
  checked,
  onChange,
  testId,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  testId?: string
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center shrink-0">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <div
        className={`h-[22px] w-10 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <div
          className={`mt-[2px] ml-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  )
}

export default function NotificationsContent() {
  const { addToast } = useToast()
  const { logDashboardActivity } = useActivityLogger()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    jobCompletion: true,
    failures: true,
    dailyReports: true,
    criticalAlerts: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await authenticatedFetch(AUTH_ENDPOINTS.SETTINGS)
        if (res.ok) {
          const json = await res.json()
          const s = json.data?.settings ?? json.settings
          setNotifications({
            jobCompletion: s.email_job_completion || false,
            failures: s.email_job_failure || false,
            dailyReports: s.email_daily_report || false,
            criticalAlerts: s.email_quota_alerts || false,
          })
        }
      } catch {
        /* defaults are fine */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
          <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800/50" />
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
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 first:pt-0">
            <div className="pr-3">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <Toggle
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
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        data-testid="button-save-notifications"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  )
}
