'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, SquareArrowOutUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── InfoCard ───────────────────────────────────────────── */

export function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

/* ─── InfoRow ────────────────────────────────────────────── */

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );
}

/* ─── CopyableId ─────────────────────────────────────────── */

export function CopyableId({ id, label, full }: { id: string; label?: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 group font-mono text-sm text-gray-700 hover:text-gray-900 transition-colors"
      title={`Click to copy${label ? ` ${label}` : ''}: ${id}`}
    >
      {full ? id : id.slice(0, 8)}
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
      )}
    </button>
  );
}

/* ─── IdWithOpenButton ───────────────────────────────────── */

export function IdWithOpenButton({ id, href, label }: { id: string; href: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 group text-sm text-gray-700 hover:text-gray-900 font-mono transition-colors"
        title={`Click to copy ${label ?? 'ID'}`}
      >
        {id}
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500" />
        ) : (
          <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
        )}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); window.open(href, '_blank'); }}
        className="p-0.5 rounded text-gray-300 hover:text-blue-600 transition-colors"
        title={`Open ${label ?? 'detail'} in new tab`}
      >
        <SquareArrowOutUpRight className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

/* ─── PageHeader ─────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ─── RouteError ─────────────────────────────────────────── */

/**
 * Lightweight error boundary for admin sub-routes.
 * Usage: export default function XxxError(props) { return <RouteError {...props} message="Failed to load xxx" />; }
 */
export function RouteError({
  error,
  reset,
  message = 'Failed to load this page',
}: {
  error: Error;
  reset: () => void;
  message?: string;
}) {
  useEffect(() => {
    console.error(message, error);
  }, [error, message]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">{message}</p>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/* ─── PageLoading ────────────────────────────────────────── */

/** Full-page centered spinner for root loading.tsx */
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

/* ─── TableLoading ───────────────────────────────────────── */

/** Skeleton placeholder for table/list routes */
export function TableLoading({ rows = 8, rowHeight = 'h-12' }: { rows?: number; rowHeight?: string }) {
  return (
    <div className="space-y-6">
      <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${rowHeight} bg-gray-100 rounded animate-pulse`} />
        ))}
      </div>
    </div>
  );
}

/* ─── Pagination ─────────────────────────────────────────── */

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Left-side label, e.g. "Showing 1–25 of 100". Defaults to "Page X of Y". */
  label?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-8 py-3 border-t border-gray-200">
      <span className="text-xs text-gray-500 tabular-nums">
        {label ?? `Page ${page} of ${totalPages}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 px-2 tabular-nums">Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
