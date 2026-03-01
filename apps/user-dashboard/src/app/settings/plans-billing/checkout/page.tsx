'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from '@indexnow/ui';
import {
  BillingPeriodSelector,
  OrderSummary,
  PaymentErrorBoundary,
  CheckoutForm,
  CheckoutHeader,
  CheckoutLoading,
  PackageNotFound,
  CheckoutSubmitButton,
  PaymentMethodSelector,
} from '@indexnow/ui/checkout';
import { PaymentSchemas, logger } from '@indexnow/shared';
import { usePaddle } from '@indexnow/ui/providers';
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui/hooks';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { type PaymentPackage } from '@indexnow/ui/billing';
import { useProfile, usePackageById, useTrialEligibility } from '@/lib/hooks';

// Types
interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  description: string;
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { paddle, isLoading: paddleLoading } = usePaddle();

  // URL parameters
  const [package_id] = useState(searchParams?.get('package'));
  const [billing_period, setBillingPeriod] = useState(searchParams?.get('period') || 'monthly');
  const [isTrialFlow, setIsTrialFlow] = useState(searchParams?.get('trial') === 'true');

  // React Query hooks — replace manual GET orchestration
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: pkgData, isLoading: pkgLoading } = usePackageById(package_id);
  const { data: trialData } = useTrialEligibility(isTrialFlow);

  // Derived state from hooks
  const userId = (profile as unknown as Record<string, unknown>)?.id as string | null ?? null;
  const selectedPackage = (pkgData as unknown as PaymentPackage) ?? null;
  const loading = profileLoading || pkgLoading;
  const trialEligible = trialData?.eligible ?? null;
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState<CheckoutFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'ID',
    description: '',
  });

  // Activity logging
  usePageViewLogger('/settings/plans-billing/checkout', 'Checkout', {
    section: 'billing_checkout',
  });
  const { logBillingActivity } = useActivityLogger();

  // Auto-populate form fields from profile
  useEffect(() => {
    if (!profile) return;
    const prof = profile as unknown as Record<string, string | null | undefined>;
    const userName = prof.full_name || prof.email?.split('@')[0] || '';
    const nameParts = (userName as string).split(' ');
    setForm(prev => ({
      ...prev,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: prof.email || '',
      phone: prof.phone_number || '',
      country: prof.country || 'ID',
    }));
  }, [profile]);

  // Redirect if no package selected
  useEffect(() => {
    if (!package_id) {
      router.push('/settings/plans-billing');
    }
  }, [package_id, router]);

  // Pricing calculation (flat USD structure)
  const calculatePrice = () => {
    if (!selectedPackage) return { price: 0, discount: 0, originalPrice: 0 };

    if (
      selectedPackage.pricing_tiers &&
      typeof selectedPackage.pricing_tiers === 'object' &&
      selectedPackage.pricing_tiers[billing_period]
    ) {
      const pricingData = selectedPackage.pricing_tiers[billing_period];

      const price = pricingData.promo_price || pricingData.regular_price;
      const originalPrice = pricingData.regular_price;
      const discount = pricingData.promo_price
        ? Math.round(((originalPrice - pricingData.promo_price) / originalPrice) * 100)
        : 0;

      return { price, discount, originalPrice };
    }

    return { price: 0, discount: 0, originalPrice: 0 };
  };

  // Handle Paddle checkout
  const handleCheckout = async () => {
    if (!paddle || !selectedPackage || !userId) {
      addToast({
        title: 'Unable to proceed',
        description: 'Please wait for the payment system to load.',
        type: 'error',
      });
      return;
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
        country: form.country, // Uses user profile country or form-entered value
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        addToast({
          title: 'Validation Error',
          description: firstError.message,
          type: 'error',
        });
        return;
      }
    }

    setProcessing(true);

    try {
      // Get the Paddle price ID from the selected package
      const pricingData = selectedPackage.pricing_tiers[billing_period];
      const priceId = pricingData?.paddle_price_id;

      if (!priceId) {
        throw new Error('Paddle Price ID not found for selected package');
      }

      logBillingActivity(
        'checkout_initiated',
        `Starting Paddle checkout for ${selectedPackage.name} (${billing_period})`,
        {
          package_id: selectedPackage.id,
          package_slug: selectedPackage.slug,
          billing_period,
          is_trial: isTrialFlow,
          price_id: priceId,
        }
      );

      // Open Paddle checkout overlay
      // Note: Paddle handles payment failures within the overlay (no redirect)
      // Users can close overlay and retry. Only successful payments redirect to successUrl.
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: form.email,
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
          country: form.country,
        },
        settings: {
          displayMode: 'overlay',
          successUrl: `${window.location.origin}/?subscription=success`,
          theme: 'light',
          locale: 'en',
        },
      });

      logBillingActivity(
        'paddle_overlay_opened',
        `Paddle checkout overlay opened for ${selectedPackage.name}`,
        {
          package_slug: selectedPackage.slug,
          price_id: priceId,
        }
      );
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Checkout error');
      addToast({
        title: 'Checkout failed',
        description:
          error instanceof Error ? error.message : 'Unable to open checkout. Please try again.',
        type: 'error',
      });

      logBillingActivity(
        'checkout_error',
        `Checkout error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          package_id: selectedPackage?.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return <CheckoutLoading />;
  }

  // Package not found state
  if (!selectedPackage) {
    return <PackageNotFound onBack={() => router.push('/settings/plans-billing')} />;
  }

  const { price, discount, originalPrice } = calculatePrice();

  return (
    <PaymentErrorBoundary>
      <div className="bg-secondary min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <CheckoutHeader
            selectedPackage={selectedPackage}
            onBack={() => router.push('/settings/plans-billing')}
          />

          <div className="grid gap-8 lg:grid-cols-3">
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
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-muted-foreground text-sm">
                          You will be redirected to our secure payment partner, Paddle, to complete
                          your purchase. Paddle accepts all major credit cards and supports multiple
                          payment methods.
                        </p>
                      </div>

                      {isTrialFlow && trialEligible && (
                        <div className="bg-success/10 border-success/20 rounded-lg border p-4">
                          <p className="text-success text-sm font-medium">
                            ✨ Free Trial Available
                          </p>
                          <p className="text-success/80 mt-1 text-xs">
                            Start your free trial today. No payment required until the trial period
                            ends.
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={handleCheckout}
                        disabled={
                          paddleLoading ||
                          processing ||
                          !paddle ||
                          !userId ||
                          !form.email ||
                          !form.first_name
                        }
                        className="w-full"
                        size="lg"
                        data-testid="button-complete-checkout"
                      >
                        {processing || paddleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {paddleLoading ? 'Loading payment...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            {isTrialFlow && trialEligible
                              ? 'Start Free Trial'
                              : 'Complete Purchase'}
                          </>
                        )}
                      </Button>

                      {!paddle && !paddleLoading && (
                        <p className="text-destructive text-center text-xs">
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
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
