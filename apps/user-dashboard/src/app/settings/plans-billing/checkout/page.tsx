'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
  BillingPeriodSelector,
  OrderSummary,
  PaymentErrorBoundary,
  CheckoutForm,
  CheckoutHeader,
  CheckoutLoading,
  PackageNotFound,
  CheckoutSubmitButton,
  PaymentMethodSelector
} from '@indexnow/ui'
import { ApiEndpoints as API, PaymentSchemas, authenticatedFetch, logger } from '@indexnow/shared'
import { usePaddle } from '@indexnow/ui'
import { supabaseBrowser } from '@indexnow/database'
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

// Types
interface PricingTier {
  regular_price: number;
  promo_price?: number;
  paddle_price_id?: string;
}

interface PaymentPackage {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  billing_period: string
  pricing_tiers: Record<string, PricingTier>
  features: string[]
  description: string
  free_trial_enabled?: boolean
}

interface CheckoutForm {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  description: string
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const { paddle, isLoading: paddleLoading } = usePaddle()

  // URL parameters
  const [package_id] = useState(searchParams?.get('package'))
  const [billing_period, setBillingPeriod] = useState(searchParams?.get('period') || 'monthly')
  const [isTrialFlow, setIsTrialFlow] = useState(searchParams?.get('trial') === 'true')

  // State
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)

  const [form, setForm] = useState<CheckoutForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'ID',
    description: ''
  })

  // Activity logging
  usePageViewLogger('/dashboard/settings/plans-billing/checkout', 'Checkout', { section: 'billing_checkout' })
  const { logBillingActivity } = useActivityLogger()

  // Data loading effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get authentication session and user
        const { data: { session } } = await supabaseBrowser.auth.getSession()
        if (!session?.access_token || !session?.user) {
          addToast({
            title: "Authentication required",
            description: "Please log in to continue.",
            type: "error"
          })
          router.push('/auth/login')
          return
        }

        // Store user ID for checkout
        setUserId(session.user.id)

        // Fetch full user profile including country data
        const profileResponse = await authenticatedFetch(API.AUTH.PROFILE)

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile')
        }

        const profileResult = await profileResponse.json()
        const profileData = profileResult?.success === true && profileResult.data ? profileResult.data : profileResult
        const userProfile = profileData.profile

        // Auto-populate user information from full profile
        const userName = userProfile.full_name || userProfile.email?.split('@')[0] || ''
        const nameParts = userName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        setForm(prev => ({
          ...prev,
          first_name: firstName,
          last_name: lastName,
          email: userProfile.email || '',
          phone: userProfile.phone_number || '',
          country: userProfile.country || ''
        }))

        // Fetch package data
        const packageResponse = await authenticatedFetch(API.BILLING.PACKAGE_BY_ID(package_id!))

        if (!packageResponse.ok) {
          throw new Error('Failed to load checkout data')
        }

        const packageResult = await packageResponse.json()
        const packageData = packageResult?.success === true && packageResult.data ? packageResult.data : packageResult

        setSelectedPackage(packageData.data || packageData)

        // Check trial eligibility if needed
        if (isTrialFlow) {
          const trialResponse = await authenticatedFetch(API.AUTH.TRIAL_ELIGIBILITY)
          if (trialResponse.ok) {
            const trialResult = await trialResponse.json()
            setTrialEligible(trialResult.eligible)
          }
        }

      } catch (error) {
        logger.error({ error: error instanceof Error ? error : undefined }, 'Error fetching checkout data')
        addToast({
          title: "Error loading checkout",
          description: "Please try again later.",
          type: "error"
        })
      } finally {
        setLoading(false)
      }
    }

    if (package_id) {
      fetchData()
    } else {
      router.push('/dashboard/settings/plans-billing')
    }
  }, [package_id, router, addToast, isTrialFlow])

  // Pricing calculation (flat USD structure)
  const calculatePrice = () => {
    if (!selectedPackage) return { price: 0, discount: 0, originalPrice: 0 }

    if (selectedPackage.pricing_tiers && typeof selectedPackage.pricing_tiers === 'object' && selectedPackage.pricing_tiers[billing_period]) {
      const pricingData = selectedPackage.pricing_tiers[billing_period]

      const price = pricingData.promo_price || pricingData.regular_price
      const originalPrice = pricingData.regular_price
      const discount = pricingData.promo_price ? Math.round(((originalPrice - pricingData.promo_price) / originalPrice) * 100) : 0

      return { price, discount, originalPrice }
    }

    return { price: 0, discount: 0, originalPrice: 0 }
  }

  // Handle Paddle checkout
  const handleCheckout = async () => {
    if (!paddle || !selectedPackage || !userId) {
      addToast({
        title: "Unable to proceed",
        description: "Please wait for the payment system to load.",
        type: "error"
      })
      return
    }

    // Validate form data
    try {
      PaymentSchemas.customerInfo.parse({
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.zip_code,
        country: form.country // Uses user profile country or form-entered value
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        addToast({
          title: "Validation Error",
          description: firstError.message,
          type: "error"
        })
        return
      }
    }

    setProcessing(true)

    try {
      // Get the Paddle price ID from the selected package
      const pricingData = selectedPackage.pricing_tiers[billing_period]
      const priceId = pricingData?.paddle_price_id

      if (!priceId) {
        throw new Error('Paddle Price ID not found for selected package')
      }

      logBillingActivity('checkout_initiated', `Starting Paddle checkout for ${selectedPackage.name} (${billing_period})`, {
        package_id: selectedPackage.id,
        package_slug: selectedPackage.slug,
        billing_period,
        is_trial: isTrialFlow,
        price_id: priceId
      })

      // Open Paddle checkout overlay
      // Note: Paddle handles payment failures within the overlay (no redirect)
      // Users can close overlay and retry. Only successful payments redirect to successUrl.
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: form.email
        },
        customData: {
          userId: userId,
          packageId: selectedPackage.id,
          packageSlug: selectedPackage.slug,
          billingPeriod: billing_period,
          isTrial: isTrialFlow.toString(),
          firstName: form.first_name,
          lastName: form.last_name,
          phone: form.phone,
          country: form.country
        },
        settings: {
          displayMode: 'overlay',
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          theme: 'light',
          locale: 'en',
        },
      })

      logBillingActivity('paddle_overlay_opened', `Paddle checkout overlay opened for ${selectedPackage.name}`, {
        package_slug: selectedPackage.slug,
        price_id: priceId
      })

    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Checkout error')
      addToast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unable to open checkout. Please try again.",
        type: "error"
      })

      logBillingActivity('checkout_error', `Checkout error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        package_id: selectedPackage?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setProcessing(false)
    }
  }

  // Loading state
  if (loading) {
    return <CheckoutLoading />
  }

  // Package not found state
  if (!selectedPackage) {
    return <PackageNotFound onBack={() => router.push('/dashboard/settings/plans-billing')} />
  }

  const { price, discount, originalPrice } = calculatePrice()

  return (
    <PaymentErrorBoundary>
      <div className="min-h-screen bg-secondary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <CheckoutHeader
            selectedPackage={selectedPackage}
            onBack={() => router.push('/dashboard/settings/plans-billing')}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Billing Period Selection */}
                <BillingPeriodSelector
                  selectedPackage={selectedPackage}
                  selectedPeriod={billing_period}
                  onPeriodChange={setBillingPeriod}
                />

                {/* Checkout Form */}
                <CheckoutForm form={form} setForm={setForm} />

                {/* Paddle Checkout Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          You will be redirected to our secure payment partner, Paddle, to complete your purchase.
                          Paddle accepts all major credit cards and supports multiple payment methods.
                        </p>
                      </div>

                      {isTrialFlow && trialEligible && (
                        <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-success">
                            ✨ Free Trial Available
                          </p>
                          <p className="text-xs text-success/80 mt-1">
                            Start your free trial today. No payment required until the trial period ends.
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleCheckout}
                        disabled={paddleLoading || processing || !paddle || !userId || !form.email || !form.first_name}
                        className="w-full"
                        size="lg"
                        data-testid="button-complete-checkout"
                      >
                        {processing || paddleLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {paddleLoading ? 'Loading payment...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            {isTrialFlow && trialEligible ? 'Start Free Trial' : 'Complete Purchase'}
                          </>
                        )}
                      </Button>

                      {!paddle && !paddleLoading && (
                        <p className="text-xs text-destructive text-center">
                          Unable to load payment system. Please refresh the page.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                selectedPackage={selectedPackage}
                billingPeriod={billing_period}
                isTrialFlow={isTrialFlow}
              />
            </div>
          </div>
        </div>
      </div>
    </PaymentErrorBoundary>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  )
}
