'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Separator,
  useToast,
} from '@indexnow/ui';
import { Upload, CheckCircle, Clock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { BILLING_ENDPOINTS, formatCurrency, logger, type Json } from '@indexnow/shared';
import { authenticatedFetch } from '@indexnow/supabase-client';
import { supabaseBrowser } from '@indexnow/database/client';

interface Transaction {
  id: string;
  user_id: string;
  package_id: string;
  gateway_id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency: string;
  payment_proof_url: string | null;
  billing_period: string;
  created_at: string;
  metadata: Record<string, Json>;
  package: {
    id: string;
    name: string;
    description: string;
    features: string[];
  };
  gateway: {
    id: string;
    name: string;
    configuration: {
      bank_name?: string;
      account_name?: string;
      account_number?: string;
    };
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [params.id]);

  const fetchTransactionDetails = async () => {
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      const response = await authenticatedFetch(
        `${BILLING_ENDPOINTS.HISTORY.replace('/history', '')}/orders/${params.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Map API response to frontend Transaction interface
        const orderData = data.data;
        const mappedTransaction = {
          id: orderData.order_id,
          user_id: '', // Not needed for frontend
          package_id: orderData.package?.id || '',
          gateway_id: '', // Not needed for frontend
          transaction_type: 'purchase',
          transaction_status: orderData.status,
          amount: orderData.amount,
          currency: orderData.currency,
          payment_proof_url: null, // Will be set if exists
          billing_period: orderData.billing_period || 'one-time',
          created_at: orderData.created_at,
          metadata: orderData,
          package: orderData.package || {
            id: '',
            name: 'Unknown Package',
            description: '',
            features: [],
          },
          gateway: {
            id: '',
            name: orderData.payment_method || 'Unknown Gateway',
            configuration: {},
          },
          customer_info: orderData.customer_info || {
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
          },
        };
        setTransaction(mappedTransaction);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error : undefined },
        'Error fetching transaction'
      );
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load order details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        addToast({
          type: 'error',
          title: 'File Type Error',
          description: 'Please upload JPG, PNG, WebP, or PDF files only',
        });
        return;
      }

      if (file.size > maxSize) {
        addToast({
          type: 'error',
          title: 'File Size Error',
          description: 'File size must be less than 5MB',
        });
        return;
      }

      setProofFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !transaction) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof_file', proofFile);
      formData.append('transaction_id', transaction.id);

      const response = await authenticatedFetch(BILLING_ENDPOINTS.UPLOAD_PROOF, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload payment proof');
      }

      const result = await response.json();

      // Update transaction status
      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              transaction_status: 'proof_uploaded',
              payment_proof_url: result.file_url,
            }
          : null
      );

      addToast({
        type: 'success',
        title: 'Upload Successful',
        description: 'Payment proof uploaded successfully! We will verify your payment soon.',
      });

      setShowUploadForm(false);
      setProofFile(null);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error : undefined }, 'Error uploading proof');
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: 'Failed to upload payment proof. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

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
            <Upload className="mr-1 h-3 w-3" />
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
            onClick={() => router.push('/dashboard/settings?tab=plans-billing')}
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
            onClick={() => router.push('/dashboard/settings?tab=plans-billing')}
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
                        month: 'long',
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
                      {transaction.amount !== null && transaction.amount !== undefined
                        ? transaction.currency === 'USD'
                          ? `$${transaction.amount}`
                          : `Rp ${transaction.amount.toLocaleString('id-ID')}`
                        : 'N/A'}
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
                      {transaction.customer_info.phone_number ||
                        (transaction.metadata as Record<string, Record<string, string>>)
                          ?.customer_info?.phone ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Information (40%) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.transaction_status === 'completed' ? (
                  <div className="bg-success/10 border-success/20 rounded-lg border p-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="text-success mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground mb-1 font-medium">
                          Payment Completed Successfully
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
                          Your payment is being processed. You will be notified once it's completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">Payment Method</p>
                    <p className="text-muted-foreground text-sm">{transaction.gateway.name}</p>
                  </div>

                  {transaction.gateway.configuration?.bank_name && (
                    <>
                      <div>
                        <p className="text-foreground text-sm font-medium">Bank</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.gateway.configuration.bank_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">Account Name</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.gateway.configuration.account_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">Account Number</p>
                        <p className="text-muted-foreground font-mono text-sm">
                          {transaction.gateway.configuration.account_number}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-foreground text-sm font-medium">Amount to Pay</p>
                    <p className="text-foreground text-lg font-bold">
                      {transaction.amount !== null && transaction.amount !== undefined
                        ? transaction.currency === 'USD'
                          ? `$${transaction.amount}`
                          : `Rp ${transaction.amount.toLocaleString('id-ID')}`
                        : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-foreground text-sm font-medium">Reference Number</p>
                    <p className="text-muted-foreground font-mono text-sm">{transaction.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Proof Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-semibold">
                  Payment Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.payment_proof_url ? (
                  <div className="py-6 text-center">
                    <CheckCircle className="text-success mx-auto mb-3 h-12 w-12" />
                    <h3 className="text-foreground mb-2 font-semibold">Payment Proof Uploaded</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      We have received your payment proof and will verify it soon.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(transaction.payment_proof_url!, '_blank')}
                      className="border-border text-muted-foreground hover:bg-secondary"
                    >
                      View Uploaded Proof
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-center text-sm">
                      {transaction.transaction_status === 'completed'
                        ? 'Payment has been processed successfully. No further action required.'
                        : 'Upload your payment proof here to speed up payment verification.'}
                    </p>

                    <Button
                      onClick={() => setShowUploadForm(!showUploadForm)}
                      disabled={transaction.transaction_status === 'completed'}
                      className="bg-success hover:bg-success/90 text-success-foreground w-full disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showUploadForm ? (
                        <EyeOff className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {transaction.transaction_status === 'completed'
                        ? 'Payment Completed'
                        : showUploadForm
                          ? 'Hide Upload Form'
                          : 'Upload Payment Proof'}
                    </Button>

                    {showUploadForm && (
                      <div className="border-border space-y-4 border-t pt-4">
                        <div>
                          <Label
                            htmlFor="proof_file"
                            className="text-foreground text-sm font-medium"
                          >
                            Select Payment Proof *
                          </Label>
                          <Input
                            id="proof_file"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileSelect}
                            className="mt-1"
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Supported formats: JPG, PNG, WebP, PDF (Max 5MB)
                          </p>
                        </div>

                        {proofFile && (
                          <div className="bg-secondary border-border rounded-lg border p-3">
                            <p className="text-foreground text-sm font-medium">Selected File:</p>
                            <p className="text-muted-foreground text-sm">{proofFile.name}</p>
                            <p className="text-muted-foreground text-xs">
                              Size: {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={handleUploadProof}
                          disabled={!proofFile || uploading}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Payment Proof
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
