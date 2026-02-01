'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Label } from '../label'
import { PaymentErrorBoundary } from './PaymentErrorBoundary'

interface PaymentMethod {
  id: string;
  name: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[]
  selectedMethod: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  isLoading?: boolean
}

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethod,
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
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod?.id === method.id
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent hover:bg-secondary'
          } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !method.disabled && onSelect(method)}
        >
                <RadioGroupItem 
                  value={gateway.id} 
                  id={gateway.id}
                  className={selectedMethod === gateway.id ? 'border-primary text-primary' : 'border-border text-foreground'}
                />
                <div className="flex-1">
                  <Label htmlFor={gateway.id} className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <div className="font-medium text-foreground">{gateway.name}</div>
                    </div>
                    {gateway.is_default && (
                      <span className="text-xs bg-warning text-white px-2 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
        </CardContent>
      </Card>
    </PaymentErrorBoundary>
  )
}
