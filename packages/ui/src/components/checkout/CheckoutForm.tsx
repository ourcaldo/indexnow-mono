'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input } from '../input';
import { Label } from '../label';
import { cn } from '../../lib/utils';
import { Search, ChevronsUpDown, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CountryOption {
  code: string;
  name: string;
  flag?: string;
}

export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
}

export interface CheckoutFormProps {
  form: CheckoutFormData;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  countries: CountryOption[];
}

/* ------------------------------------------------------------------ */
/*  Country Search Dropdown                                            */
/* ------------------------------------------------------------------ */

function CountrySearchDropdown({
  value,
  onChange,
  countries,
}: {
  value: string;
  onChange: (code: string) => void;
  countries: CountryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, search]);

  const selected = useMemo(
    () => countries.find((c) => c.code === value),
    [countries, value]
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) setTimeout(() => searchInputRef.current?.focus(), 0);
      if (!next) setSearch('');
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
      setSearch('');
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 h-10 text-sm',
          'ring-offset-background transition-colors',
          'hover:bg-muted/60',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="truncate text-left">
          {selected ? `${selected.flag ?? ''} ${selected.name}`.trim() : 'Select country'}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Country list */}
          <div className="max-h-[200px] overflow-y-auto overscroll-contain p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No country found.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={cn(
                    'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none',
                    'outline-none transition-colors',
                    'hover:bg-muted',
                    value === c.code && 'bg-muted font-medium'
                  )}
                >
                  <Check
                    className={cn('mr-2 h-3.5 w-3.5 shrink-0', value === c.code ? 'opacity-100' : 'opacity-0')}
                  />
                  <span>
                    {c.flag && <span className="mr-1.5">{c.flag}</span>}
                    {c.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkout Form                                                      */
/* ------------------------------------------------------------------ */

export const CheckoutForm = ({ form, setForm, countries }: CheckoutFormProps) => {
  const update =
    (field: keyof CheckoutFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  /** Phone: always store as +<digits>. Strip everything except digits. */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    setForm((prev) => ({ ...prev, phone: digits ? `+${digits}` : '' }));
  };

  /** Display value strips the leading + so we can show it as a prefix adornment */
  const phoneDigits = form.phone.replace(/^\+/, '');

  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" className="text-xs font-medium text-muted-foreground">
            First name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            type="text"
            required
            value={form.first_name}
            onChange={update('first_name')}
            className="mt-1.5 h-10"
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-xs font-medium text-muted-foreground">
            Last name
          </Label>
          <Input
            id="last_name"
            type="text"
            value={form.last_name}
            onChange={update('last_name')}
            className="mt-1.5 h-10"
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          Email address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={update('email')}
          className="mt-1.5 h-10"
          placeholder="john@example.com"
        />
      </div>

      {/* Phone + Country row */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sm:col-span-3">
          <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
            Phone number <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              +
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              required
              value={phoneDigits}
              onChange={handlePhoneChange}
              className="h-10 pl-7"
              placeholder="628123456789"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            Country
          </Label>
          <div className="mt-1.5">
            <CountrySearchDropdown
              value={form.country}
              onChange={(code) => setForm((prev) => ({ ...prev, country: code }))}
              countries={countries}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
