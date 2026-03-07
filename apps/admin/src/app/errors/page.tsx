'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Copy,
  Check,
} from 'lucide-react';
import {
  useAdminErrorStats,
  useAdminErrorList,
  useAdminErrorDetail,
  useErrorAction,
  type TimeRange,
  type SeverityFilter,
  type ErrorLogEntry,
  type ErrorStats,
} from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { ErrorResolveActions } from '@/components/ErrorResolveActions';
import { CodeBlock } from '@/components/CodeBlock';
import {
  getSeverityDotColor,
  getErrorStatus,
  formatErrorDate,
  hasMetadata,
} from '@/lib/error-helpers';
import { format } from 'date-fns';

/** Safely display a message that might be an object or the literal string "[object Object]" */
function displayMessage(msg: unknown): string {
  if (msg === null || msg === undefined) return '—';
  if (typeof msg === 'string') {
    // Detect literal "[object Object]" stored in DB from bad serialization
    if (msg === '[object Object]' || msg.trim() === '[object Object]')
      return '(no message — serialization error)';
    return msg;
  }
  if (typeof msg === 'object') {
    const obj = msg as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    try {
      return JSON.stringify(msg);
    } catch {
      return String(msg);
    }
  }
  return String(msg);
}

/** Each card takes exactly 1/5 of the visible strip (minus gaps).
 *  We use a CSS custom property set by StatCardStrip so width stays in sync. */
function StatBadge({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  accent?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`stat-card flex-shrink-0 rounded-xl border px-5 py-4 text-left transition-all ${
        active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`text-2xl font-bold tabular-nums ${accent || 'text-gray-900'}`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </button>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
  error: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  debug: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

/* ─── Scrollable stat card strip with arrow buttons ──────── */

const CARD_GAP = 12; // gap-3 = 12px
const VISIBLE_CARDS = 5;

function StatCardStrip({
  stats,
  severity,
  onSeverityClick,
}: {
  stats: ErrorStats | null | undefined;
  severity: SeverityFilter;
  onSeverityClick: (s: SeverityFilter) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* ── Drag-to-scroll state (refs to avoid re-renders) ── */
  const dragState = useRef({
    active: false,
    startX: 0,
    scrollStart: 0,
    moved: false,
    pointerId: -1,
  });

  /** Width of one card (derived from container).
   *  Formula: (containerWidth - gaps) / VISIBLE_CARDS  */
  const getCardWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 200;
    const totalGaps = CARD_GAP * (VISIBLE_CARDS - 1);
    return (el.clientWidth - totalGaps) / VISIBLE_CARDS;
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  /* Sync card widths via CSS custom property */
  const syncCardWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const w = getCardWidth();
    el.style.setProperty('--card-w', `${w}px`);
  }, [getCardWidth]);

  /* ── Mouse / touch drag handlers ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    // Don't capture pointer yet — wait until the user actually drags past threshold.
    // Capturing immediately steals events from child <button> elements, blocking onClick.
    dragState.current = {
      active: true,
      startX: e.clientX,
      scrollStart: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    if (Math.abs(dx) > 3 && !ds.moved) {
      ds.moved = true;
      setIsDragging(true);
      // Only capture pointer once dragging is confirmed — this allows clean taps to reach buttons
      const el = scrollRef.current;
      if (el) el.setPointerCapture(ds.pointerId);
    }
    if (ds.moved) {
      const el = scrollRef.current;
      if (el) el.scrollLeft = ds.scrollStart - dx;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const wasMoved = dragState.current.moved;
    dragState.current.active = false;
    dragState.current.moved = false;
    setIsDragging(false);
    const el = scrollRef.current;
    // Only release capture if we actually captured it during drag
    if (el && wasMoved) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
    }
  }, []);

  useEffect(() => {
    syncCardWidth();
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const onResize = () => {
      syncCardWidth();
      checkScroll();
    };
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [checkScroll, syncCardWidth]);

  /** Scroll by exactly one card + gap */
  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardWidth() + CARD_GAP;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  return (
    <div className="relative border-b border-gray-200">
      {/* Left arrow */}
      {showLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute top-1/2 left-1 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Cards — drag to scroll */}
      <div
        ref={scrollRef}
        className={`flex gap-3 overflow-x-auto px-8 py-5 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (dragState.current.moved) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <style>{`
          .stat-scroll::-webkit-scrollbar { display: none; }
          .stat-card { width: var(--card-w, 180px); }
        `}</style>
        <StatBadge
          label="All Errors"
          value={stats?.summary?.totalErrors ?? 0}
          active={severity === 'all'}
          onClick={() => onSeverityClick('all')}
        />
        <StatBadge
          label="Critical"
          value={stats?.summary?.criticalErrors ?? 0}
          accent={(stats?.summary?.criticalErrors ?? 0) > 0 ? 'text-red-600' : undefined}
          active={severity === 'critical'}
          onClick={() => onSeverityClick('critical')}
        />
        <StatBadge
          label="Error"
          value={stats?.summary?.highErrors ?? 0}
          accent={(stats?.summary?.highErrors ?? 0) > 0 ? 'text-amber-600' : undefined}
          active={severity === 'error'}
          onClick={() => onSeverityClick('error')}
        />
        <StatBadge
          label="Warning"
          value={stats?.summary?.warningErrors ?? 0}
          active={severity === 'warning'}
          onClick={() => onSeverityClick('warning')}
        />
        <StatBadge
          label="Info / Debug"
          value={stats?.summary?.infoErrors ?? 0}
          active={severity === 'info'}
          onClick={() => onSeverityClick('info')}
        />
        <StatBadge
          label="Unresolved"
          value={stats?.summary?.unresolvedErrors ?? 0}
          accent={(stats?.summary?.unresolvedErrors ?? 0) > 0 ? 'text-amber-600' : undefined}
          active={false}
        />
        <StatBadge
          label="Resolved"
          value={stats?.summary?.resolvedErrors ?? 0}
          accent={(stats?.summary?.resolvedErrors ?? 0) > 0 ? 'text-emerald-600' : undefined}
          active={false}
        />
      </div>

      {/* Right arrow */}
      {showRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute top-1/2 right-1 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}

/* ─── Copyable ID chip ───────────────────────────────────── */

function CopyableId({ id, label }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className="inline-flex items-center gap-1.5 font-mono text-sm text-gray-700 transition-colors hover:text-gray-900"
      title={`Copy ${label || 'ID'}`}
    >
      {id.slice(0, 12)}...
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </button>
  );
}

/* ─── Detail row ─────────────────────────────────────────── */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-50 px-3.5 py-2.5 last:border-0">
      <span className="flex-shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-700">{children}</span>
    </div>
  );
}

/* ─── Error slide-over panel ─────────────────────────────── */

function ErrorSlideOver({ errorId, onClose }: { errorId: string; onClose: () => void }) {
  const { data: errorDetail, isLoading } = useAdminErrorDetail(errorId);
  const errorAction = useErrorAction(errorId);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const err = errorDetail?.error;
  const sentry = errorDetail?.sentry;
  const resolverInfo = errorDetail?.resolverInfo;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="animate-in slide-in-from-right fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl duration-200">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="truncate text-sm font-semibold text-gray-900">Error Detail</h2>
          <div className="flex items-center gap-1">
            {sentry?.url && (
              <button
                onClick={() => window.open(sentry.url!, '_blank')}
                className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                title="Open in Sentry"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 72 66" fill="currentColor">
                  <path d="M29 2.26a3.68 3.68 0 0 0-6.37 0L.55 45.16a3.68 3.68 0 0 0 3.18 5.52h7.46a3.68 3.68 0 0 0 3.18-1.84l11.87-20.54a12.07 12.07 0 0 1 10.47 11.96h-5.26a3.68 3.68 0 0 0 0 7.36h12.62V40.3a19.43 19.43 0 0 0-16.86-19.26L41.97 2.26a3.68 3.68 0 0 0 6.37 0l21.11 36.53a3.68 3.68 0 0 1-3.18 5.52h-7.46" />
                </svg>
                Sentry
              </button>
            )}
            <button
              onClick={() => {
                window.open(`/errors/${errorId}`, '_blank');
              }}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
          ) : !err ? (
            <p className="py-12 text-center text-sm text-gray-500">Error not found</p>
          ) : (
            <>
              {/* Title + Severity */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${getSeverityDotColor(err.severity)}`}
                  />
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.debug}`}
                  >
                    {err.severity}
                  </span>
                  <span className="text-xs text-gray-500">{err.error_type}</span>
                </div>
                <p className="mt-2 text-sm font-semibold break-words text-gray-900">
                  {displayMessage(err.message)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatErrorDate(err.created_at)}
                </p>
              </div>

              {/* ID */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3.5 py-2.5">
                <span className="text-sm text-gray-500">Error ID</span>
                <CopyableId id={err.id} label="Error ID" />
              </div>

              {/* Details */}
              <div className="rounded-lg border border-gray-100 bg-white">
                <DetailRow label="Status">
                  <span className={getErrorStatus(err).colorClass}>
                    {getErrorStatus(err).label}
                  </span>
                </DetailRow>
                <DetailRow label="Recorded">
                  {formatErrorDate(err.created_at)}
                </DetailRow>
                {err.acknowledged_at && (
                  <DetailRow label="Acknowledged">
                    {formatErrorDate(err.acknowledged_at)}
                  </DetailRow>
                )}
                {err.resolved_at && (
                  <DetailRow label="Resolved">
                    <div className="text-right">
                      <div>{formatErrorDate(err.resolved_at)}</div>
                      {resolverInfo && (
                        <div className="mt-0.5 text-xs text-gray-400">
                          by {resolverInfo.full_name || resolverInfo.email || 'Admin'}
                        </div>
                      )}
                      {!resolverInfo && err.resolved_by === null && (
                        <div className="mt-0.5 text-xs text-gray-400">by Sentry webhook</div>
                      )}
                    </div>
                  </DetailRow>
                )}
                {err.endpoint && (
                  <DetailRow label="Endpoint">
                    <span className="font-mono text-xs">
                      {err.http_method} {err.endpoint}
                    </span>
                  </DetailRow>
                )}
                {err.status_code && <DetailRow label="Status code">{err.status_code}</DetailRow>}
                {err.user_id && (
                  <DetailRow label="User">
                    <button
                      onClick={() => window.open(`/users/${err.user_id}`, '_blank')}
                      className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {err.user_id.slice(0, 12)}...
                    </button>
                  </DetailRow>
                )}
                {sentry?.issueId && (
                  <DetailRow label="Sentry Issue">
                    <button
                      onClick={() => sentry.url && window.open(sentry.url, '_blank')}
                      className="font-mono text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      #{sentry.issueId}
                    </button>
                  </DetailRow>
                )}
              </div>

              {/* Sentry grouped info */}
              {sentry?.siblingCount != null && sentry.siblingCount > 0 && (
                <div className="rounded-lg border border-purple-100 bg-purple-50 px-3.5 py-2.5">
                  <p className="text-xs text-purple-700">
                    This error is grouped with{' '}
                    <span className="font-semibold">
                      {sentry.siblingCount} other unresolved error
                      {sentry.siblingCount > 1 ? 's' : ''}
                    </span>{' '}
                    in Sentry. Resolving will resolve all of them.
                  </p>
                </div>
              )}

              {/* Stack trace */}
              {err.stack_trace && (
                <CodeBlock
                  title="Stack Trace"
                  content={err.stack_trace}
                  variant="dark"
                  maxHeight="max-h-60"
                  cardStyle={false}
                />
              )}

              {/* Metadata */}
              {hasMetadata(err.metadata) && (
                <CodeBlock
                  title="Metadata"
                  content={JSON.stringify(err.metadata, null, 2)}
                  variant="light"
                  cardStyle={false}
                />
              )}

              {/* Actions */}
              <div className="pt-2">
                <ErrorResolveActions
                  sentry={sentry}
                  isPending={errorAction.isPending}
                  isResolved={!!err.resolved_at}
                  isAcknowledged={!!err.acknowledged_at}
                  onAction={(action) => errorAction.mutate(action)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function ErrorsPage() {
  useAdminPageViewLogger('errors', 'Error Logs');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useAdminErrorStats(timeRange);
  const { data: listData, isLoading: listLoading } = useAdminErrorList(page, severity, timeRange);
  const stats = data?.stats;
  const errors = listData?.errors ?? [];
  const pagination = listData?.pagination;

  const TrendIcon =
    stats?.trend?.direction === 'up'
      ? TrendingUp
      : stats?.trend?.direction === 'down'
        ? TrendingDown
        : Minus;
  const trendColor =
    stats?.trend?.direction === 'up'
      ? 'text-red-600'
      : stats?.trend?.direction === 'down'
        ? 'text-emerald-600'
        : 'text-gray-400';

  const handleSeverityClick = (s: SeverityFilter) => {
    setSeverity(s);
    setPage(1);
  };

  const handleCloseSlideOver = useCallback(() => setSelectedErrorId(null), []);

  return (
    <div className="min-h-full bg-white">
      {/* ─── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Errors</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {stats?.summary?.totalErrors?.toLocaleString() ?? 0} total in selected range
            {stats?.trend && (
              <span className={`ml-2 inline-flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {stats.trend.currentPeriodCount} vs {stats.trend.previousPeriodCount} prev
                </span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Time range filter ───────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-3">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range);
                setPage(1);
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 px-8 py-5 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200" />
          ))}
        </div>
      ) : (
        <>
          {/* ─── Stat badges with arrow scroll ─────────────── */}
          <StatCardStrip stats={stats} severity={severity} onSeverityClick={handleSeverityClick} />

          {/* ─── Errors table ────────────────────────────────── */}
          {listLoading ? (
            <div className="space-y-3 px-8 py-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
          ) : errors.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-400">No errors found for this filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="w-10 py-3 pr-3 pl-8 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        #
                      </th>
                      <th className="w-20 px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        ID
                      </th>
                      <th className="w-20 px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Severity
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Message
                      </th>
                      <th className="w-28 px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Type
                      </th>
                      <th className="w-40 px-3 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Endpoint
                      </th>
                      <th className="w-28 py-3 pr-8 pl-3 text-left text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((err: ErrorLogEntry, idx: number) => {
                      const rowNum =
                        ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 50) + idx + 1;
                      return (
                        <tr
                          key={err.id}
                          onClick={() => setSelectedErrorId(err.id)}
                          className="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-blue-50/40"
                        >
                          <td className="py-3 pr-3 pl-8 text-xs text-gray-400 tabular-nums">
                            {rowNum}
                          </td>
                          <td
                            className={`px-3 py-3 font-mono text-sm ${err.resolved_at ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {err.id.slice(0, 8)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${SEVERITY_COLORS[err.severity] || SEVERITY_COLORS.debug}`}
                            >
                              {err.severity}
                            </span>
                          </td>
                          <td className="max-w-[400px] truncate px-3 py-3 text-sm text-gray-900">
                            {displayMessage(err.message)}
                          </td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-500">
                            {err.error_type}
                          </td>
                          <td className="max-w-[160px] truncate px-3 py-3 font-mono text-xs text-gray-500">
                            {err.endpoint
                              ? `${err.http_method || ''} ${err.endpoint}`.trim()
                              : '\u2014'}
                          </td>
                          <td className="py-3 pr-8 pl-3 text-xs whitespace-nowrap text-gray-500 tabular-nums">
                            {format(new Date(err.created_at), 'MMM d, HH:mm')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── Pagination ────────────────────────────────── */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-8 py-3">
                  <span className="text-xs text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} errors)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNextPage}
                      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Error slide-over panel ──────────────────────── */}
      {selectedErrorId && (
        <ErrorSlideOver errorId={selectedErrorId} onClose={handleCloseSlideOver} />
      )}
    </div>
  );
}
