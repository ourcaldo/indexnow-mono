'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Label } from '../label'
import { PaymentErrorBoundary } from './PaymentErrorBoundary'

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  is_default?: boolean;
}

export interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[]
  selectedMethodId: string | null
  onSelect: (methodId: string) => void
  isLoading?: boolean
}

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onSelect,
  isLoading = false
}: PaymentMethodSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-secondary animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <PaymentErrorBoundary>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedMethodId || ''} 
            onValueChange={onSelect}
            className="grid gap-4"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center space-x-4 border rounded-lg p-4 transition-all ${
                  selectedMethodId === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !method.disabled && onSelect(method.id)}
              >
                <RadioGroupItem 
                  value={method.id} 
                  id={method.id}
                  disabled={method.disabled}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={method.id} 
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="font-medium text-foreground">{method.name}</div>
                    </div>
                    {method.is_default && (
                      <span className="text-xs bg-warning text-white px-2 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </PaymentErrorBoundary>
  )
}
