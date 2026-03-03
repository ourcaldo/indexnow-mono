import React from 'react';
import { Input } from '../input';
import { Label } from '../label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

const COUNTRIES = [
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thailand' },
  { value: 'PH', label: 'Philippines' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'KR', label: 'South Korea' },
] as const;

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
}

export const CheckoutForm = ({ form, setForm }: CheckoutFormProps) => {
  const update = (field: keyof CheckoutFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
          <Input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={update('phone')}
            className="mt-1.5 h-10"
            placeholder="+62 812 3456 7890"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            Country
          </Label>
          <Select
            value={form.country}
            onValueChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
          >
            <SelectTrigger className="mt-1.5 h-10">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
