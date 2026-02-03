import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../button'

export interface CheckoutHeaderProps {
  selectedPackage: { name: string } | null
  onBack: () => void
}

export const CheckoutHeader = ({ selectedPackage, onBack }: CheckoutHeaderProps) => {
  return (
    <div className="mb-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 text-muted-foreground hover:text-foreground hover:bg-secondary border-0"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Plans
      </Button>
      <h1 className="text-2xl font-bold text-foreground">Complete Your Order</h1>
      <p className="text-muted-foreground mt-1">
        Fill in your details to upgrade to {selectedPackage?.name || 'selected plan'}
      </p>
    </div>
  )
}
