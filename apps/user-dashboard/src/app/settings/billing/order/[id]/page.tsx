'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  useToast,
} from '@indexnow/ui';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@indexnow/shared';
import { useOrderDetails } from '@/lib/hooks';

interface Transaction {
  id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency: string;
  billing_period: string;
  created_at: string;
  payment_method: string;
  package: {
    id: string;
    name: string;
    description: string;
    features: string[];
  };
  customer_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

export default function OrderCompletedPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const { data: orderData, isLoading: loading } = useOrderDetails(params.id as string | undefined);

  // Map API response to local Transaction shape whenever orderData changes
  useEffect(() => {
    if (!orderData) return;
    setTransaction({
      id: orderData.order_id,
      transaction_type: 'purchase',
      transaction_status: orderData.status,
      amount: orderData.amount,
      currency: orderData.currency,
      billing_period: orderData.billing_period || 'one-time',
      created_at: orderData.created_at,
      payment_method: orderData.payment_method || 'Paddle',
      package: (orderData.package as Transaction['package']) || {
        id: '',
        name: 'Unknown Package',
        description: '',
        features: [],
      },
      customer_info: (orderData.customer_info as Transaction['customer_info']) || {
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
      },
    });
  }, [orderData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Pending Payment
          </Badge>
        );
      case 'proof_uploaded':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Waiting for Confirmation
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="bg-secondary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-foreground mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-secondary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-4 h-16 w-16" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => router.push('/settings?tab=billing')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/settings?tab=billing')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Order Completed</h1>
              <p className="text-muted-foreground mt-1">
                Thank you for your order! Here are your order details.
              </p>
            </div>
            {getStatusBadge(transaction.transaction_status)}
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left Column - Order Details (60%) */}
          <div className="space-y-6 lg:col-span-3">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">Order ID</p>
                    <p className="text-muted-foreground font-mono text-sm break-all">
                      {transaction.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Order Date</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Package</p>
                    <p className="text-muted-foreground text-sm">{transaction.package.name}</p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Billing Period</p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.billing_period
                        ? transaction.billing_period.charAt(0).toUpperCase() +
                          transaction.billing_period.slice(1)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-foreground font-semibold">{transaction.package.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {transaction.package.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-foreground mb-2 font-medium">Package Features:</p>
                    <ul className="space-y-1">
                      {transaction.package.features?.map((feature: string, index: number) => (
                        <li key={index} className="text-muted-foreground flex items-center text-sm">
                          <CheckCircle className="text-success mr-2 h-3 w-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">Total Amount</span>
                    <span className="text-foreground text-xl font-bold">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">Name</p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.customer_info.first_name} {transaction.customer_info.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Email</p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.customer_info.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Phone</p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.customer_info.phone_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Status (40%) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.transaction_status === 'completed' ? (
                  <div className="bg-success/10 border-success/20 rounded-lg border p-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="text-success mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground mb-1 font-medium">
                          Payment Completed
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Your payment has been processed and your package is now active.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-warning/10 border-warning/20 rounded-lg border p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground mb-1 font-medium">Payment Processing</p>
                        <p className="text-muted-foreground text-sm">
                          Your payment is being processed. You will be notified once it&apos;s completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">Payment Method</p>
                    <p className="text-muted-foreground text-sm">{transaction.payment_method}</p>
                  </div>

                  <div>
                    <p className="text-foreground text-sm font-medium">Amount Paid</p>
                    <p className="text-foreground text-lg font-bold">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-foreground text-sm font-medium">Reference Number</p>
                    <p className="text-muted-foreground font-mono text-sm">{transaction.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
