import { redirect } from 'next/navigation'

/** /settings/general is no longer a valid route — redirect to the unified settings page. */
export default function GeneralSettingsRedirect() {
  redirect('/settings')
}
