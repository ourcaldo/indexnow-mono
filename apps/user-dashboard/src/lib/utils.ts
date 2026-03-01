/**
 * Shared UI utility helpers for the user dashboard.
 */

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

/**
 * Format an ISO date/timestamp string as "Mar 1, 2026".
 * Always uses en-US locale for consistency across browsers.
 */
export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', DATE_FMT)
}

/**
 * Format an ISO timestamp string as "Mar 1, 2026, 2:45 PM".
 * Use for events where the time is meaningful (e.g. transactions).
 */
export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { ...DATE_FMT, hour: '2-digit', minute: '2-digit' })
}

/**
 * Normalize a device_type value to a display label.
 * 'mobile' → 'Mobile', anything else (including null/undefined) → 'Desktop'
 */
export function fmtDevice(device: string | null | undefined): string {
  if (device === 'mobile') return 'Mobile'
  return 'Desktop'
}

/**
 * Format a country for display. Prefers full name, falls back to ISO code lookup, then ISO code.
 */
const ISO_NAMES: Record<string, string> = {
  AF:'Afghanistan',AM:'Armenia',AR:'Argentina',AU:'Australia',AT:'Austria',
  AZ:'Azerbaijan',BD:'Bangladesh',BE:'Belgium',BR:'Brazil',CA:'Canada',
  CL:'Chile',CN:'China',CO:'Colombia',HR:'Croatia',CZ:'Czechia',
  DK:'Denmark',EG:'Egypt',FI:'Finland',FR:'France',DE:'Germany',
  GH:'Ghana',GR:'Greece',HK:'Hong Kong',HU:'Hungary',IN:'India',
  ID:'Indonesia',IE:'Ireland',IL:'Israel',IT:'Italy',JP:'Japan',
  KE:'Kenya',KR:'South Korea',MY:'Malaysia',MX:'Mexico',MA:'Morocco',
  NL:'Netherlands',NZ:'New Zealand',NG:'Nigeria',NO:'Norway',PK:'Pakistan',
  PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',RO:'Romania',
  RU:'Russia',SA:'Saudi Arabia',SG:'Singapore',ZA:'South Africa',ES:'Spain',
  SE:'Sweden',CH:'Switzerland',TW:'Taiwan',TH:'Thailand',TR:'Turkey',
  UA:'Ukraine',AE:'United Arab Emirates',GB:'United Kingdom',US:'United States',
  VN:'Vietnam',
}

export function fmtCountry(
  country: { name?: string | null; iso2_code?: string | null } | string | null | undefined
): string {
  if (!country) return '—'
  if (typeof country === 'string') {
    const iso = country.toUpperCase()
    return ISO_NAMES[iso] || country || '—'
  }
  if (country.name) return country.name
  if (country.iso2_code) {
    const iso = country.iso2_code.toUpperCase()
    return ISO_NAMES[iso] || country.iso2_code
  }
  return '—'
}
