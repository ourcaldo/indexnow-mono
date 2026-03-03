'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, useToast } from '@indexnow/ui';
import {
  BillingPeriodSelector,
  OrderSummary,
  PaymentErrorBoundary,
  CheckoutForm,
  CheckoutLoading,
  PackageNotFound,
} from '@indexnow/ui/checkout';
import { PaymentSchemas, logger, countries } from '@indexnow/shared';
import { usePaddle } from '@indexnow/ui/providers';
import { usePageViewLogger, useActivityLogger } from '@indexnow/ui/hooks';
import { ArrowLeft, Loader2, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import { z } from 'zod';
import { type PaymentPackage } from '@indexnow/ui/billing';
import { useProfile, usePackageById, useTrialEligibility } from '@/lib/hooks';

// Types
interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { paddle, isLoading: paddleLoading } = usePaddle();

  // URL parameters
  const [package_id] = useState(searchParams?.get('package'));
  const rawPeriod = searchParams?.get('period') || 'monthly';
  const [billing_period, setBillingPeriod] = useState(
    rawPeriod === 'yearly' ? 'annual' : rawPeriod
  );
  const [isTrialFlow] = useState(searchParams?.get('trial') === 'true');

  // React Query hooks
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: pkgData, isLoading: pkgLoading } = usePackageById(package_id);
  const { data: trialData } = useTrialEligibility(isTrialFlow);

  // Derived state — use user_id (auth.users FK), NOT id (profile table PK)
  const userId = profile?.user_id ?? null;
  const selectedPackage = (pkgData as PaymentPackage | null) ?? null;
  const loading = profileLoading || pkgLoading;
  const trialEligible = trialData?.eligible ?? null;
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState<CheckoutFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: 'ID',
  });

  // Activity logging
  usePageViewLogger('/settings/billing/checkout', 'Checkout', {
    section: 'billing_checkout',
  });
  const { logBillingActivity } = useActivityLogger();

  // Auto-populate from profile
  useEffect(() => {
    if (!profile) return;
    const userName = profile.full_name || profile.email?.split('@')[0] || '';
    const nameParts = userName.split(' ');
    // Normalize phone to +<digits> format
    const rawPhone = profile.phone_number || '';
    const phoneDigits = rawPhone.replace(/[^\d]/g, '');
    setForm((prev) => ({
      ...prev,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: profile.email || '',
      phone: phoneDigits ? `+${phoneDigits}` : '',
      country: profile.country || 'ID',
    }));
  }, [profile]);

  // Redirect if no package selected
  useEffect(() => {
    if (!package_id) {
      router.push('/settings?tab=billing');
    }
  }, [package_id, router]);

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

    // Validate
    try {
      PaymentSchemas.customerInfo.parse({
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        phone: form.phone,
        country: form.country,
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

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: form.email },
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
        { package_slug: selectedPackage.slug, price_id: priceId }
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
    return <PackageNotFound onBack={() => router.push('/settings?tab=billing')} />;
  }

  const isReady = !paddleLoading && !!paddle && !!userId && !!form.email && !!form.first_name;

  return (
    <PaymentErrorBoundary>
      <div className="-m-4 lg:-m-6">
        {/* Top bar */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={() => router.push('/settings?tab=billing')}
              className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to plans</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isTrialFlow && trialEligible ? 'Start your free trial' : 'Complete your order'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe to the{' '}
              <span className="font-medium text-foreground">{selectedPackage.name}</span> plan
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left column — form area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Step 1 — Billing cycle */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                    1
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">Billing cycle</h2>
                </div>
                <BillingPeriodSelector
                  selectedPackage={selectedPackage}
                  selectedPeriod={billing_period}
                  onPeriodChange={setBillingPeriod}
                />
              </section>

              {/* Step 2 — Account details */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                    2
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">Account details</h2>
                </div>
                <CheckoutForm form={form} setForm={setForm} countries={countries} />
              </section>

              {/* Step 3 — Payment */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                    3
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">Payment</h2>
                </div>

                <div className="rounded-xl border border-border bg-background p-5">
                  {/* Trial callout */}
                  {isTrialFlow && trialEligible && (
                    <div className="mb-4 flex items-start gap-3 rounded-lg bg-accent/5 border border-accent/15 p-3.5">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <ShieldCheck className="h-3 w-3 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Free trial included</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Try risk-free for 7 days. You won't be charged until the trial period
                          ends.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Paddle info */}
                  <div className="mb-5 flex items-start gap-3 text-sm text-muted-foreground">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Payment is handled securely by{' '}
                      <span className="font-medium text-foreground">Paddle</span>. All major cards,
                      PayPal and local methods are accepted.
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={handleCheckout}
                    disabled={!isReady || processing}
                    className="w-full h-11 text-sm font-medium bg-accent text-white hover:bg-accent/90 rounded-lg"
                    size="lg"
                    data-testid="button-complete-checkout"
                  >
                    {processing || paddleLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {paddleLoading ? 'Loading payment...' : 'Processing...'}
                      </>
                    ) : isTrialFlow && trialEligible ? (
                      'Start Free Trial'
                    ) : (
                      'Continue to Payment'
                    )}
                  </Button>

                  {!paddle && !paddleLoading && (
                    <p className="mt-3 text-center text-xs text-destructive">
                      Unable to load payment system. Please refresh the page.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Right column — order summary */}
            <div className="lg:col-span-2">
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
