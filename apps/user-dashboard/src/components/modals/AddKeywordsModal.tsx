'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  X,
  Loader2,
  Search,
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  Tag,
  Plus,
  AlertCircle,
  Check,
  ChevronDown,
  ListPlus,
} from 'lucide-react'
import {
  useDomains,
  useCountries,
  useAddKeywords,
  useKeywordUsage,
  useCreateDomain,
  type Domain,
  type Country,
} from '../../lib/hooks'

interface AddKeywordsModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedDomainId?: string
}

export function AddKeywordsModal({
  open,
  onClose,
  onSuccess,
  preselectedDomainId,
}: AddKeywordsModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [keywordText, setKeywordText] = useState('')
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop')
  const [selectedCountryId, setSelectedCountryId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [domainSearch, setDomainSearch] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [showDomainDropdown, setShowDomainDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const domainDropdownRef = useRef<HTMLDivElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  const { data: domains, isLoading: domainsLoading } = useDomains()
  const { data: countries, isLoading: countriesLoading } = useCountries()
  const { data: keywordUsage } = useKeywordUsage()
  const addKeywords = useAddKeywords()
  const createDomain = useCreateDomain()

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedDomainId(preselectedDomainId || '')
      setKeywordText('')
      setDeviceType('desktop')
      setSelectedCountryId('')
      setTags([])
      setTagInput('')
      setErrors({})
      setShowAddDomain(false)
      setNewDomainName('')
      setDomainSearch('')
      setCountrySearch('')
    }
  }, [open, preselectedDomainId])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (domainDropdownRef.current && !domainDropdownRef.current.contains(e.target as Node)) {
        setShowDomainDropdown(false)
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedDomain = domains?.find(d => d.id === selectedDomainId)
  const selectedCountry = countries?.find(c => c.id === selectedCountryId)

  const filteredDomains = useMemo(() => {
    if (!domains) return []
    if (!domainSearch) return domains
    const q = domainSearch.toLowerCase()
    return domains.filter(d =>
      d.domain_name.toLowerCase().includes(q) ||
      (d.display_name?.toLowerCase().includes(q))
    )
  }, [domains, domainSearch])

  const filteredCountries = useMemo(() => {
    if (!countries) return []
    if (!countrySearch) return countries.filter(c => c.is_active !== false)
    const q = countrySearch.toLowerCase()
    return countries
      .filter(c => c.is_active !== false)
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.iso2_code?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q)
      )
  }, [countries, countrySearch])

  const keywordsList = useMemo(() => {
    return keywordText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
  }, [keywordText])

  const handleCreateDomain = async () => {
    const cleaned = newDomainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!cleaned) return
    try {
      const result = await createDomain.mutateAsync({
        domain_name: cleaned,
        display_name: cleaned,
      })
      setSelectedDomainId(result.data?.id)
      setShowAddDomain(false)
      setNewDomainName('')
    } catch (err) {
      setErrors(prev => ({ ...prev, domain: err instanceof Error ? err.message : 'Failed to create domain' }))
    }
  }

  const handleNext = () => {
    if (!selectedDomainId) {
      setErrors({ domain: 'Please select a domain' })
      return
    }
    setErrors({})
    setStep(2)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!selectedDomainId) newErrors.domain = 'Please select a domain'
    if (keywordsList.length === 0) newErrors.keywords = 'Enter at least one keyword'
    if (!selectedCountryId) newErrors.country = 'Please select a country'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await addKeywords.mutateAsync({
        domain_id: selectedDomainId,
        keywords: keywordsList,
        device_type: deviceType,
        country_id: selectedCountryId,
        tags,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to add keywords' })
    }
  }

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  if (!open) return null

  const isLoading = domainsLoading || countriesLoading

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-[#161822] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <ListPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Keywords</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 1 ? 'Select a domain to track keywords for' : 'Configure and add your keywords'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <StepPill active={step >= 1} number={1} label="Domain" />
          <div className={`h-px w-8 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
          <StepPill active={step >= 2} number={2} label="Keywords" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : step === 1 ? (
            /* === STEP 1: Domain Selection === */
            <div className="space-y-4">
              {/* Domain Selector */}
              {domains && domains.length > 0 && (
                <div ref={domainDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Domain
                  </label>
                  <button
                    onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl transition-all ${
                      selectedDomainId
                        ? 'border-blue-500 ring-1 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } text-gray-900 dark:text-gray-100`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{selectedDomain ? (selectedDomain.display_name || selectedDomain.domain_name) : 'Choose a domain...'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDomainDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDomainDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <input
                          type="text"
                          placeholder="Search domains..."
                          value={domainSearch}
                          onChange={e => setDomainSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredDomains.map(d => (
                          <button
                            key={d.id}
                            onClick={() => {
                              setSelectedDomainId(d.id)
                              setShowDomainDropdown(false)
                              setDomainSearch('')
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              d.id === selectedDomainId
                                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Globe className="w-4 h-4 shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="font-medium truncate">{d.display_name || d.domain_name}</div>
                              {d.display_name && d.display_name !== d.domain_name && (
                                <div className="text-xs text-gray-400 truncate">{d.domain_name}</div>
                              )}
                            </div>
                            {d.id === selectedDomainId && <Check className="w-4 h-4 ml-auto text-blue-500 shrink-0" />}
                          </button>
                        ))}
                        {filteredDomains.length === 0 && (
                          <p className="px-4 py-3 text-sm text-gray-400 text-center">No domains found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add new domain inline */}
              {!showAddDomain ? (
                <button
                  onClick={() => setShowAddDomain(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Domain
                </button>
              ) : (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Domain</span>
                    <button
                      onClick={() => { setShowAddDomain(false); setNewDomainName('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="example.com"
                      value={newDomainName}
                      onChange={e => setNewDomainName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateDomain()}
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleCreateDomain}
                      disabled={!newDomainName.trim() || createDomain.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {createDomain.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                  {errors.domain && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3" /> {errors.domain}
                    </p>
                  )}
                </div>
              )}

              {/* No domains state */}
              {domains && domains.length === 0 && !showAddDomain && (
                <div className="text-center py-6">
                  <Globe className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No domains yet</p>
                  <p className="text-xs text-gray-400">Add a domain first to start tracking keywords</p>
                </div>
              )}
            </div>
          ) : (
            /* === STEP 2: Keyword Configuration === */
            <div className="space-y-5">
              {/* Selected domain info */}
              {selectedDomain && (
                <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                      {selectedDomain.display_name || selectedDomain.domain_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Device & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Device Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'desktop' as const, label: 'Desktop', icon: Monitor },
                      { value: 'mobile' as const, label: 'Mobile', icon: Smartphone },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDeviceType(opt.value)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          deviceType === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div ref={countryDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl transition-all ${
                      selectedCountryId
                        ? 'border-blue-500 ring-1 ring-blue-500/20'
                        : errors.country
                          ? 'border-red-400 ring-1 ring-red-500/20'
                          : 'border-gray-200 dark:border-gray-700'
                    } text-gray-900 dark:text-gray-100`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className={selectedCountry ? '' : 'text-gray-400'}>
                        {selectedCountry ? `${selectedCountry.name} (${selectedCountry.iso2_code})` : 'Select country...'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1c2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCountryId(c.id)
                              setShowCountryDropdown(false)
                              setCountrySearch('')
                              setErrors(prev => { const { country, ...rest } = prev; return rest })
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                              c.id === selectedCountryId
                                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className="text-xs text-gray-400">{c.iso2_code}</span>
                            {c.id === selectedCountryId && <Check className="w-4 h-4 ml-auto text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.country && (
                    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3" /> {errors.country}
                    </p>
                  )}
                </div>
              </div>

              {/* Keywords textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  {keywordUsage && (
                    <span className="text-xs text-gray-400">
                      {keywordUsage.used} / {keywordUsage.is_unlimited ? '∞' : keywordUsage.limit} keywords used
                    </span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  placeholder={'Enter one keyword per line:\n\nbest coffee shops\ncoffee near me\nhow to brew coffee'}
                  rows={8}
                  value={keywordText}
                  onChange={e => { setKeywordText(e.target.value); setErrors(prev => { const { keywords, ...rest } = prev; return rest }) }}
                  className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none font-mono leading-relaxed transition-all"
                />
                <div className="flex items-center justify-between mt-1.5">
                  {keywordsList.length > 0 ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {keywordsList.length} keyword{keywordsList.length !== 1 ? 's' : ''} ready
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">One keyword per line</span>
                  )}
                </div>
                {errors.keywords && (
                  <p className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" /> {errors.keywords}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tags <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 rounded-lg"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="ml-0.5 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
          {step === 1 ? (
            <>
              <div />
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedDomainId}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={keywordsList.length === 0 || !selectedCountryId || addKeywords.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {addKeywords.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add {keywordsList.length} Keyword{keywordsList.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepPill({ active, number, label }: { active: boolean; number: number; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
    }`}>
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
        active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        {number}
      </span>
      {label}
    </div>
  )
}
