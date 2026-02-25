'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { useCreateDomain, useDomains } from '../../lib/hooks'

interface AddDomainModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (domainId: string) => void
}

export function AddDomainModal({ open, onClose, onSuccess }: AddDomainModalProps) {
  const [domainName, setDomainName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const createDomain = useCreateDomain()
  const { data: domains } = useDomains()

  useEffect(() => {
    if (open) {
      setDomainName('')
      setDisplayName('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async () => {
    const cleaned = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!cleaned) {
      setError('Please enter a domain name')
      return
    }

    // Basic domain validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(cleaned)) {
      setError('Please enter a valid domain (e.g., example.com)')
      return
    }

    // Check duplicate
    if (domains?.some(d => d.domain_name === cleaned)) {
      setError('This domain is already added')
      return
    }

    setError('')
    try {
      const result = await createDomain.mutateAsync({
        domain_name: cleaned,
        display_name: displayName.trim() || cleaned,
      })
      onSuccess?.(result.data?.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create domain')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[#161822] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Domain</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a new domain to track keywords for</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Domain name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Domain Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="example.com"
                value={domainName}
                onChange={e => { setDomainName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Enter the root domain without http:// or www</p>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Display Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="My Website"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Existing domains count */}
          {domains && domains.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <Check className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                You currently have {domains.length} domain{domains.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!domainName.trim() || createDomain.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {createDomain.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Add Domain
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
