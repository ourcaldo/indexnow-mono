'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useRankHistory, type RankHistoryKeyword } from '../../lib/hooks'

// ── Date helpers ───────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isoToday(): string {
  return new Date().toISOString().split('T')[0]
}

function subtractDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

function getDateColumns(startDate: string, endDate: string): string[] {
  const cols: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const d = new Date(end)
  while (d >= start) {
    cols.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() - 1)
  }
  return cols
}

function dateColLabel(iso: string): { day: string; month: string } {
  const d = new Date(iso + 'T00:00:00')
  return { day: String(d.getDate()), month: MONTHS_SHORT[d.getMonth()] }
}

// ── Country flags ──────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', AU: '🇦🇺', ID: '🇮🇩', FR: '🇫🇷',
  SG: '🇸🇬', JP: '🇯🇵', IN: '🇮🇳', CA: '🇨🇦', BR: '🇧🇷', MX: '🇲🇽',
  KR: '🇰🇷', NL: '🇳🇱', IT: '🇮🇹', ES: '🇪🇸', PL: '🇵🇱', SE: '🇸🇪',
  MY: '🇲🇾', TH: '🇹🇭', PH: '🇵🇭', VN: '🇻🇳',
}

function countryFlag(iso2: string): string {
  return FLAG_MAP[(iso2 || '').toUpperCase()] || '🌐'
}

// ── Position badge ─────────────────────────────────────────────────────────────

function PosBadge({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
  const color =
    pos <= 3 ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : pos <= 10 ? 'text-blue-600 dark:text-blue-400 font-semibold'
    : pos <= 20 ? 'text-amber-600 dark:text-amber-400 font-medium'
    : 'text-gray-500 dark:text-gray-400'
  return <span className={`text-sm tabular-nums ${color}`}>{pos}</span>
}

// ── Rank cell (date column) ────────────────────────────────────────────────────

function RankCell({ pos }: { pos: number | undefined }) {
  if (pos === undefined) return <span className="text-gray-200 dark:text-gray-700 text-[11px]">–</span>
  const color =
    pos <= 3 ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
    : pos <= 10 ? 'text-blue-600 dark:text-blue-400 font-semibold'
    : pos <= 20 ? 'text-amber-600 dark:text-amber-400'
    : 'text-gray-500 dark:text-gray-400'
  return <span className={`text-[12px] font-medium tabular-nums ${color}`}>{pos}</span>
}

// ── Change cell ────────────────────────────────────────────────────────────────

function ChangeCell({ change }: { change: number | null }) {
  if (change === null || change === 0) return <span className="text-gray-300 dark:text-gray-600 text-xs">–</span>
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="w-3 h-3" /> +{change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
      <TrendingDown className="w-3 h-3" /> {change}
    </span>
  )
}

// ── Date range presets ─────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Past 2 days', days: 2 },
  { label: 'Past 7 days', days: 7 },
  { label: 'Past 30 days', days: 30 },
  { label: 'Past 60 days', days: 60 },
  { label: 'Past 90 days', days: 90 },
  { label: 'Past 6 months', days: 180 },
  { label: 'Past 1 year', days: 365 },
  { label: 'All time', days: 840 },
]

// ── Calendar month ─────────────────────────────────────────────────────────────

interface CalMonthProps {
  year: number
  month: number
  pendingStart: string | null
  pendingEnd: string | null
  today: string
  side: 'left' | 'right'
  onNav: (dir: -1 | 1) => void
  onDay: (iso: string) => void
}

function CalendarMonth({ year, month, pendingStart, pendingEnd, today, side, onNav, onDay }: CalMonthProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInPrev = new Date(year, month, 0).getDate()

  function makeISO(d: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function dayCls(iso: string): string {
    const base = 'w-7 h-7 flex items-center justify-center text-xs rounded cursor-pointer border-none font-medium transition-all '
    if (iso > today) return base + 'text-gray-200 pointer-events-none'
    const isStart = iso === pendingStart
    const isEnd = iso === pendingEnd
    const inRange = !!(pendingStart && pendingEnd && iso > pendingStart && iso < pendingEnd)
    if (isStart || isEnd) return base + 'bg-indigo-600 text-white'
    if (inRange) return base + 'bg-indigo-50 text-indigo-600'
    if (iso === today) return base + 'border border-indigo-400 text-indigo-600 hover:bg-gray-100 bg-transparent'
    return base + 'text-gray-700 hover:bg-gray-100 bg-transparent'
  }

  return (
    <div className={`w-[210px] ${side === 'right' ? 'ml-4 pl-4 border-l border-gray-100' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        {side === 'left'
          ? <button onClick={() => onNav(-1)} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          : <span className="w-6" />}
        <span className="text-xs font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        {side === 'right'
          ? <button onClick={() => onNav(1)} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          : <span className="w-6" />}
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <span key={d} className="text-[10px] font-semibold text-gray-400 py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDow }).map((_, i) => (
          <span key={`p${i}`} className="w-7 h-7 flex items-center justify-center text-[10px] text-gray-200">
            {daysInPrev - firstDow + 1 + i}
          </span>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const iso = makeISO(d)
          return (
            <button key={d} className={dayCls(iso)} onClick={() => { if (iso <= today) onDay(iso) }}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Date range picker ──────────────────────────────────────────────────────────

interface DPState {
  pendingStart: string | null
  pendingEnd: string | null
  leftMonth: { year: number; month: number }
  rightMonth: { year: number; month: number }
}

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
}

function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const today = isoToday()
  const [open, setOpen] = useState(false)
  const [dp, setDP] = useState<DPState>(() => initDP(startDate, endDate))
  const ref = useRef<HTMLDivElement>(null)

  function initDP(sd: string, ed: string): DPState {
    const s = new Date(sd + 'T00:00:00')
    const e = new Date(ed + 'T00:00:00')
    let lm = { year: s.getFullYear(), month: s.getMonth() }
    let rm = { year: e.getFullYear(), month: e.getMonth() }
    if (rm.year < lm.year || (rm.year === lm.year && rm.month <= lm.month)) {
      const n = new Date(lm.year, lm.month + 1, 1)
      rm = { year: n.getFullYear(), month: n.getMonth() }
    }
    return { pendingStart: sd, pendingEnd: ed, leftMonth: lm, rightMonth: rm }
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function openPicker() {
    setDP(initDP(startDate, endDate))
    setOpen(true)
  }

  function selectPreset(days: number) {
    const t = isoToday()
    const s = subtractDays(t, days)
    setDP(initDP(s, t))
  }

  function clickDay(iso: string) {
    setDP(prev => {
      if (!prev.pendingStart || (prev.pendingStart && prev.pendingEnd)) {
        return { ...prev, pendingStart: iso, pendingEnd: null }
      }
      if (iso < prev.pendingStart) return { ...prev, pendingStart: iso, pendingEnd: null }
      return { ...prev, pendingEnd: iso }
    })
  }

  function navMonth(dir: -1 | 1) {
    setDP(prev => {
      const l = new Date(prev.leftMonth.year, prev.leftMonth.month + dir, 1)
      const r = new Date(prev.rightMonth.year, prev.rightMonth.month + dir, 1)
      return {
        ...prev,
        leftMonth: { year: l.getFullYear(), month: l.getMonth() },
        rightMonth: { year: r.getFullYear(), month: r.getMonth() },
      }
    })
  }

  function apply() {
    if (dp.pendingStart && dp.pendingEnd) {
      onChange(dp.pendingStart, dp.pendingEnd)
      setOpen(false)
    }
  }

  function reset() {
    const t = isoToday()
    const s = subtractDays(t, 7)
    onChange(s, t)
    setOpen(false)
  }

  const activePreset = PRESETS.find(p => {
    const expected = subtractDays(endDate, p.days)
    return expected === startDate && endDate === today
  })

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span>{formatDateShort(startDate)} – {formatDateShort(endDate)}, {endDate.slice(0, 4)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 rotate-90" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 flex bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Calendars + actions */}
          <div className="flex flex-col">
            <div className="flex gap-0 p-4 border-r border-gray-100">
              <CalendarMonth
                year={dp.leftMonth.year} month={dp.leftMonth.month}
                pendingStart={dp.pendingStart} pendingEnd={dp.pendingEnd}
                today={today} side="left" onNav={navMonth} onDay={clickDay}
              />
              <CalendarMonth
                year={dp.rightMonth.year} month={dp.rightMonth.month}
                pendingStart={dp.pendingStart} pendingEnd={dp.pendingEnd}
                today={today} side="right" onNav={navMonth} onDay={clickDay}
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
              <button onClick={reset} className="px-3 py-1.5 rounded border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 transition-colors">
                Reset
              </button>
              <button
                onClick={apply}
                disabled={!dp.pendingStart || !dp.pendingEnd}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-0.5 p-3 min-w-[140px]">
            {PRESETS.map(p => {
              const active = activePreset?.days === p.days
              return (
                <button
                  key={p.days}
                  onClick={() => selectPreset(p.days)}
                  className={`px-2.5 py-1.5 text-left text-xs font-medium rounded transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Keyword row ────────────────────────────────────────────────────────────────

const COL_NUM = 44
const COL_KEYWORD = 240
const COL_POSITION = 72
const COL_CHANGE = 72

interface KeywordRowProps {
  kw: RankHistoryKeyword
  idx: number
  dateColumns: string[]
}

function KeywordRow({ kw, idx, dateColumns }: KeywordRowProps) {
  return (
    <tr className="group">
      {/* # */}
      <td
        className="sticky bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 tabular-nums text-center"
        style={{ left: 0, width: COL_NUM, minWidth: COL_NUM, zIndex: 5 }}
      >
        {idx}
      </td>

      {/* Keyword */}
      <td
        className="sticky bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100"
        style={{ left: COL_NUM, width: COL_KEYWORD, minWidth: COL_KEYWORD, zIndex: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={kw.keyword}
      >
        {kw.keyword}
      </td>

      {/* Position */}
      <td
        className="sticky bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center"
        style={{ left: COL_NUM + COL_KEYWORD, width: COL_POSITION, minWidth: COL_POSITION, zIndex: 5 }}
      >
        <PosBadge pos={kw.current_position} />
      </td>

      {/* Change — frozen edge border */}
      <td
        className="sticky bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center"
        style={{
          left: COL_NUM + COL_KEYWORD + COL_POSITION,
          width: COL_CHANGE,
          minWidth: COL_CHANGE,
          zIndex: 5,
          borderRight: '2px solid var(--tw-border, #e5e7eb)',
        }}
      >
        <ChangeCell change={kw.change} />
      </td>

      {/* Date columns */}
      {dateColumns.map((d, i) => {
        const pos = kw.history[d]
        const even = i % 2 === 0
        return (
          <td
            key={d}
            className={`border-b border-gray-100 dark:border-gray-800/50 py-2.5 text-center group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40 ${
              even ? 'bg-gray-50/60 dark:bg-white/[0.02]' : 'bg-white dark:bg-[#141520]'
            }`}
            style={{ width: 46, minWidth: 46, maxWidth: 46, padding: '10px 2px' }}
          >
            <RankCell pos={pos} />
          </td>
        )
      })}

      {/* URL — trailing edge border */}
      <td
        className="border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40"
        style={{ minWidth: 130, maxWidth: 180, borderLeft: '2px solid #e5e7eb' }}
      >
        {kw.latest_url ? (
          <a
            href={kw.latest_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
            title={kw.latest_url}
          >
            {kw.latest_url.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">–</span>
        )}
      </td>

      {/* Country */}
      <td className="border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center whitespace-nowrap bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40" style={{ minWidth: 90 }}>
        <span className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-sm leading-none">{countryFlag(kw.country)}</span>
          {kw.country || '–'}
        </span>
      </td>

      {/* Device */}
      <td className="border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40" style={{ minWidth: 80 }}>
        <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {kw.device === 'mobile'
            ? <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
            : <Monitor className="w-3.5 h-3.5 flex-shrink-0" />}
          {kw.device === 'mobile' ? 'Mobile' : 'Desktop'}
        </span>
      </td>

      {/* Last Check */}
      <td className="border-b border-gray-100 dark:border-gray-800/50 px-3 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums bg-white dark:bg-[#141520] group-hover:bg-gray-50/80 dark:group-hover:bg-gray-800/40" style={{ minWidth: 100 }}>
        {kw.latest_check || <span className="text-gray-300 dark:text-gray-600">–</span>}
      </td>
    </tr>
  )
}

// ── Rank trend chart ──────────────────────────────────────────────────────────

const BUCKETS = [
  { key: 'top3',    label: 'Top 3',   color: '#10b981' },
  { key: 'top410',  label: '4-10',    color: '#3b82f6' },
  { key: 'top1120', label: '11-20',   color: '#f59e0b' },
  { key: 'top2150', label: '21-50',   color: '#f97316' },
  { key: 'top51',   label: '51-100',  color: '#f43f5e' },
] as const

function buildChartData(keywords: RankHistoryKeyword[], dateColumns: string[]) {
  return [...dateColumns].reverse().map(date => {
    let top3 = 0, top410 = 0, top1120 = 0, top2150 = 0, top51 = 0
    for (const kw of keywords) {
      const pos = kw.history[date]
      if (pos === undefined) continue
      if (pos <= 3) top3++
      else if (pos <= 10) top410++
      else if (pos <= 20) top1120++
      else if (pos <= 50) top2150++
      else if (pos <= 100) top51++
    }
    return { date, label: formatDateShort(date), top3, top410, top1120, top2150, top51 }
  })
}

interface RankTrendChartProps {
  keywords: RankHistoryKeyword[]
  dateColumns: string[]
}

function RankTrendChart({ keywords, dateColumns }: RankTrendChartProps) {
  const data = useMemo(() => buildChartData(keywords, dateColumns), [keywords, dateColumns])
  if (data.length === 0 || keywords.length === 0) return null

  return (
    <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Keyword Rankings Trend</h2>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
          {BUCKETS.map(b => (
            <span key={b.key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="25%">
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f9fafb',
              padding: '8px 12px',
            }}
            itemStyle={{ color: '#f9fafb', padding: '1px 0' }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            formatter={(value: number, name: string) => {
              const bucket = BUCKETS.find(b => b.key === name)
              return [value, bucket?.label ?? name]
            }}
            labelFormatter={(label) => label as string}
          />
          {BUCKETS.map((b, i) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              stackId="a"
              fill={b.color}
              radius={i === BUCKETS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 50

export default function RankHistoryPage() {
  const today = useMemo(() => isoToday(), [])
  const [startDate, setStartDate] = useState(() => subtractDays(isoToday(), 7))
  const [endDate, setEndDate] = useState(today)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useRankHistory(startDate, endDate)

  const dateColumns = useMemo(
    () => getDateColumns(startDate, endDate),
    [startDate, endDate]
  )

  const keywords = data?.keywords ?? []
  const total = data?.total ?? 0

  const stats = useMemo(() => {
    const withPos = keywords.filter(k => k.current_position !== null)
    const avgRank = withPos.length > 0
      ? Math.round(withPos.reduce((sum, k) => sum + k.current_position!, 0) / withPos.length)
      : null
    return {
      improved: keywords.filter(k => k.change !== null && k.change > 0).length,
      declined: keywords.filter(k => k.change !== null && k.change < 0).length,
      top3: keywords.filter(k => k.current_position !== null && k.current_position <= 3).length,
      top10: keywords.filter(k => k.current_position !== null && k.current_position <= 10).length,
      top20: keywords.filter(k => k.current_position !== null && k.current_position <= 20).length,
      avgRank,
    }
  }, [keywords])

  const filtered = useMemo(() => {
    let result = keywords
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(k => k.keyword.toLowerCase().includes(q))
    }
    return result
  }, [keywords, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageSlice = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
  }

  function handleDateChange(s: string, e: string) {
    setStartDate(s)
    setEndDate(e)
    setPage(1)
  }

  const colSpanTotal = 4 + dateColumns.length + 4

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="h-[200px] bg-gray-100 dark:bg-gray-800/60 rounded" />
        </div>
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/60 rounded mb-2" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
          Rank History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View ranking history across all your tracked keywords
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Keywords */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{total}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Keywords</span>
          </div>
        </div>

        {/* Improved / Declined */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.improved}</span>
            <span className="text-base text-gray-300 dark:text-gray-600">/</span>
            <span className="text-2xl font-bold text-red-500 dark:text-red-400 tracking-tight">{stats.declined}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Improved / Declined</span>
          </div>
        </div>

        {/* Top 3 */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.top3}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Top 3</span>
          </div>
        </div>

        {/* Top 10 */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{stats.top10}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Top 10</span>
          </div>
        </div>

        {/* Top 20 */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{stats.top20}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Top 20</span>
          </div>
        </div>

        {/* Avg. Rank */}
        <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            {stats.avgRank !== null ? stats.avgRank : '–'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Avg. Rank</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <RankTrendChart keywords={keywords} dateColumns={dateColumns} />

      {/* Filters */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateChange} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#141520] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="border-collapse bg-white dark:bg-[#141520]"
            style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}
          >
            <thead>
              <tr>
                {/* Frozen: # */}
                <th
                  className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  style={{ left: 0, width: COL_NUM, minWidth: COL_NUM }}
                >
                  #
                </th>
                {/* Frozen: Keyword */}
                <th
                  className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800/50 text-left border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  style={{ left: COL_NUM, width: COL_KEYWORD, minWidth: COL_KEYWORD }}
                >
                  Keyword
                </th>
                {/* Frozen: Position */}
                <th
                  className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  style={{ left: COL_NUM + COL_KEYWORD, width: COL_POSITION, minWidth: COL_POSITION }}
                >
                  Pos.
                </th>
                {/* Frozen: Change — right border marks frozen edge */}
                <th
                  className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  style={{
                    left: COL_NUM + COL_KEYWORD + COL_POSITION,
                    width: COL_CHANGE,
                    minWidth: COL_CHANGE,
                    borderRight: '2px solid #e5e7eb',
                  }}
                >
                  Change
                </th>

                {/* Scrollable date columns */}
                {dateColumns.map((d, i) => {
                  const lbl = dateColLabel(d)
                  const even = i % 2 === 0
                  return (
                    <th
                      key={d}
                      className={`sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 ${
                        even ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-[#141520]'
                      }`}
                      style={{ width: 46, minWidth: 46, maxWidth: 46, textAlign: 'center', padding: '6px 2px' }}
                    >
                      <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">{lbl.day}</span>
                      <span className="block text-[9px] font-medium text-gray-400 dark:text-gray-500 leading-tight">{lbl.month}</span>
                    </th>
                  )
                })}

                {/* Trailing: URL */}
                <th
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  style={{ minWidth: 130, borderLeft: '2px solid #e5e7eb' }}
                >
                  URL
                </th>
                {/* Trailing: Country */}
                <th
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  style={{ minWidth: 90 }}
                >
                  Country
                </th>
                {/* Trailing: Device */}
                <th
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  style={{ minWidth: 80 }}
                >
                  Device
                </th>
                {/* Trailing: Last Check */}
                <th
                  className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/50 text-center border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  style={{ minWidth: 100 }}
                >
                  Last Check
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colSpanTotal} className="py-16 text-center text-sm text-gray-400">
                    Loading rank history…
                  </td>
                </tr>
              ) : pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={colSpanTotal} className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                    {search ? 'No keywords match your filter.' : 'No keywords tracked for this period.'}
                  </td>
                </tr>
              ) : (
                pageSlice.map((kw, idx) => (
                  <KeywordRow
                    key={kw.id}
                    kw={kw}
                    idx={(page - 1) * ITEMS_PER_PAGE + idx + 1}
                    dateColumns={dateColumns}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing{' '}
              <strong className="text-gray-700 dark:text-gray-300 font-medium">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}
              </strong>{' '}
              of{' '}
              <strong className="text-gray-700 dark:text-gray-300 font-medium">{filtered.length}</strong> keywords
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
