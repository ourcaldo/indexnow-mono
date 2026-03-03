import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '../button'

export const CheckoutLoading = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="text-sm text-muted-foreground">Loading checkout…</span>
      </div>
    </div>
  )
}

export interface PackageNotFoundProps {
  onBack: () => void
}

export const PackageNotFound = ({ onBack }: PackageNotFoundProps) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Package not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">The selected package could not be found.</p>
        <Button
          onClick={onBack}
          variant="outline"
          className="mt-4"
        >
          Back to Billing
        </Button>
      </div>
    </div>
  )
}
