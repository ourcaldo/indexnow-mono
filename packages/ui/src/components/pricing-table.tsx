'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import { type PackageData } from '../hooks/business/usePricingData';
import { usePricingData } from '../hooks/business/usePricingData';

interface PricingTableProps {
  showTrialButton?: boolean;
  trialEligible?: boolean;
  currentPackageId?: string | null;
  subscribing?: string | null;
  startingTrial?: string | null;
  onSubscribe?: (packageId: string, period: string) => void;
  onStartTrial?: (packageId: string) => void;
  isTrialEligiblePackage?: (pkg: PackageData) => boolean;
  className?: string;
}

export const PricingTable = React.memo(function PricingTable({
  showTrialButton = false,
  trialEligible = false,
  currentPackageId = null,
  subscribing = null,
  startingTrial = null,
  onSubscribe = () => {},
  onStartTrial = () => {},
  isTrialEligiblePackage = () => false,
  className = '',
}: PricingTableProps) {
  const {
    packages,
    selectedPeriod,
    isLoading: loading,
    error,
    setSelectedPeriod,
    formatPrice: formatCurrency,
    getPricing,
    getAvailablePeriods,
    getPeriodLabel,
  } = usePricingData();

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="border-foreground h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const availablePeriods = getAvailablePeriods();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <div className="flex justify-center">
        {availablePeriods.length === 2 ? (
          <div className="flex items-center space-x-4">
            <span
              className={`text-sm font-medium ${selectedPeriod === availablePeriods[0] ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {getPeriodLabel(availablePeriods[0])}
            </span>
            <button
              onClick={() =>
                setSelectedPeriod(
                  selectedPeriod === availablePeriods[0] ? availablePeriods[1] : availablePeriods[0]
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                selectedPeriod === availablePeriods[1] ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  selectedPeriod === availablePeriods[1] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${selectedPeriod === availablePeriods[1] ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {getPeriodLabel(availablePeriods[1])}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {availablePeriods.map((period) => {
              const periodLabel = getPeriodLabel(period);
              return (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground border-border hover:bg-border border'
                  }`}
                >
                  {periodLabel}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {packages.map((pkg) => {
          const isCurrentPlan = pkg.id === currentPackageId;
          const pricing = getPricing(pkg, selectedPeriod);

          return (
            <div
              key={pkg.id}
              className={`relative flex h-full flex-col rounded-lg border p-6 transition-colors ${
                isCurrentPlan
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:border-foreground'
              }`}
            >
              {/* Popular Badge */}
              {pkg.is_popular && !isCurrentPlan && (
                <div className="bg-primary text-primary-foreground absolute -top-3 left-4 rounded-full px-3 py-1 text-xs font-medium">
                  Most Popular
                </div>
              )}

              {/* Package Header */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3
                    className={`text-lg font-semibold ${isCurrentPlan ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {pkg.name}
                  </h3>
                  {isCurrentPlan && (
                    <span className="bg-primary-foreground text-primary rounded px-2 py-0.5 text-xs font-medium">
                      Current plan
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${isCurrentPlan ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                >
                  {pkg.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  {pricing.originalPrice && (
                    <span
                      className={`text-sm line-through ${isCurrentPlan ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                    >
                      {formatCurrency(pricing.originalPrice)}
                    </span>
                  )}
                  <span
                    className={`text-2xl font-bold ${isCurrentPlan ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {formatCurrency(pricing.price)}
                  </span>
                  <span
                    className={`text-sm ${isCurrentPlan ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                  >
                    per{' '}
                    {selectedPeriod === 'monthly'
                      ? 'month'
                      : selectedPeriod === 'annual'
                        ? 'year'
                        : 'period'}
                  </span>
                </div>
                {pricing.discount && (
                  <span className="text-success text-xs font-medium">Save {pricing.discount}%</span>
                )}
              </div>

              {/* Features */}
              <div
                className={`mb-6 border-b pb-4 ${isCurrentPlan ? 'border-primary-foreground/20' : 'border-border'} flex-grow`}
              >
                <div className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          isCurrentPlan ? 'text-primary-foreground' : 'text-success'
                        }`}
                      />
                      <span
                        className={`text-sm ${isCurrentPlan ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-2">
                {!isCurrentPlan && (
                  <>
                    <button
                      onClick={() => onSubscribe(pkg.id, selectedPeriod)}
                      disabled={subscribing === pkg.id}
                      className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        subscribing === pkg.id ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      {subscribing === pkg.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Processing...
                        </div>
                      ) : (
                        'Switch plan'
                      )}
                    </button>

                    {/* Trial Button */}
                    {showTrialButton && trialEligible && isTrialEligiblePackage(pkg) && (
                      <button
                        onClick={() => onStartTrial(pkg.id)}
                        disabled={startingTrial === pkg.id}
                        className={`border-primary text-primary hover:bg-primary hover:text-primary-foreground h-12 w-full rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          startingTrial === pkg.id ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        {startingTrial === pkg.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                            Starting...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            Start 3-Day Free Trial
                          </div>
                        )}
                      </button>
                    )}
                  </>
                )}
                {isCurrentPlan && (
                  <button
                    disabled
                    className="bg-background text-primary h-12 w-full cursor-default rounded-lg px-4 py-3 text-sm font-medium"
                  >
                    Current plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
