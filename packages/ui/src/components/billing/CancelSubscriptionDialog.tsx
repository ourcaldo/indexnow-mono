import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../dialog'
import { LoadingSpinner } from '../loading-spinner'
import { Button } from '../button'
import { RefundWindowInfo } from './types'

export interface CancelSubscriptionDialogProps {
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  canceling?: boolean
  error?: string | null
  refundInfo?: RefundWindowInfo | null
}

export function CancelSubscriptionDialog({
  onClose,
  onConfirm,
  loading = false,
  canceling = false,
  error = null,
  refundInfo = null,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-cancel-subscription">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Cancel Subscription
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We're sorry to see you go. Please review the cancellation details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4" data-testid="alert-error">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              </div>
            </div>
          ) : refundInfo ? (
            <>
              {refundInfo.refundEligible ? (
                <div className="rounded-lg bg-success/10 border border-success/20 p-4" data-testid="alert-refund-eligible">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-success">Full Refund Eligible</h3>
                      <p className="mt-1 text-sm text-success/80">
                        Your subscription will be canceled immediately and the payment will be refunded to your original payment method.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-4" data-testid="alert-no-refund">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-warning">No Refund Available</h3>
                      <p className="mt-1 text-sm text-warning/80">
                        You've exceeded the refund window. Your subscription will be canceled at the end of the current billing period, and you can continue using it until then.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-secondary/50 border border-border p-4" data-testid="alert-info">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span> This action cannot be undone. You can always subscribe again later if you change your mind.
                </p>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={canceling}
            data-testid="button-cancel-dialog"
          >
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading || canceling}
            data-testid="button-confirm-cancel"
          >
            {canceling ? 'Canceling...' : 'Yes, Cancel Subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
