import { redirect } from 'next/navigation'

/** /settings/general is no longer a valid route — redirect to /settings/profile. */
export default function GeneralSettingsRedirect() {
  redirect('/settings/profile')
}
