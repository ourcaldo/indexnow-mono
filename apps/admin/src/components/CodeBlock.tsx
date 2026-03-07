'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  title: string
  content: string
  /** Dark theme (stack traces) or light theme (metadata JSON) */
  variant?: 'dark' | 'light'
  maxHeight?: string
  /** Card style with border wrapper (detail page) vs inline label (list page) */
  cardStyle?: boolean
}

export function CodeBlock({
  title,
  content,
  variant = 'dark',
  maxHeight = 'max-h-80',
  cardStyle = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [content])

  const preClass =
    variant === 'dark'
      ? `${maxHeight} overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-[11px] break-all whitespace-pre-wrap text-gray-300`
      : `overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 font-mono text-xs break-all text-gray-600`

  if (!cardStyle) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            {title}
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title={`Copy ${title.toLowerCase()}`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className={variant === 'dark'
          ? `${maxHeight} overflow-x-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-gray-300`
          : `overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-3 font-mono text-[11px] leading-relaxed text-gray-600`
        }>
          {content}
        </pre>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={`Copy ${title.toLowerCase()}`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-hidden p-5">
        <pre className={preClass}>{content}</pre>
      </div>
    </div>
  )
}
