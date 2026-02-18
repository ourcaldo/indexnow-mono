'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Package,
  CreditCard,
  FileText,
  Download,
  Eye,
  Mail,
  Phone,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useToast,
  ErrorState,
} from '@indexnow/ui';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  logger,
  type AdminOrderDetailResponse,
  type AdminOrderTransaction,
  type AdminTransactionHistory,
  type AdminOrderActivityLog,
  type Json,
} from '@indexnow/shared';
import { fromJson } from '@indexnow/database/client';
import { OrderActivityTimeline } from './components/OrderActivityTimeline';
import { useAdminOrderDetail, useUpdateOrderStatus } from '@/hooks';

interface OrderMetadata {
  customer_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  billing_period?: string;
  billing_address?: Record<string, unknown>;
}

export default function AdminOrderDetailPage() {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<'completed' | 'failed' | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const orderId = params.id as string;

  const { data: orderData, isLoading: loading, error, refetch } = useAdminOrderDetail(orderId);
  const statusMutation = useUpdateOrderStatus(orderId);

  const handleStatusUpdate = async () => {
    if (!statusAction || !orderData) return;

    try {
      const result = await statusMutation.mutateAsync({
        status: statusAction,
        notes: statusNotes,
      });

      addToast({
        type: 'success',
        title: 'Success',
        description: result.message,
      });

      // Close modal and reset state
      setStatusModalOpen(false);
      setStatusAction(null);
      setStatusNotes('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
      addToast({
        type: 'error',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-muted/10 text-muted-foreground border-border">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'proof_uploaded':
        return (
          <Badge className="bg-muted/10 text-muted-foreground border-border">
            <AlertCircle className="mr-1 h-3 w-3" />
            Waiting for Confirmation
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge className="bg-muted/10 text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const openStatusModal = (action: 'completed' | 'failed') => {
    setStatusAction(action);
    setStatusModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-foreground mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <ErrorState
          title="Error Loading Order"
          message={error.message}
          onRetry={() => refetch()}
          showHomeButton
        />
      </div>
    );
  }

  if (!orderData) return null;

  const { order, activity_history, transaction_history } = orderData;
  const metadata = fromJson<OrderMetadata>(order.metadata);
  const features = fromJson<(string | { name: string })[]>(order.package?.features) || [];
  const canUpdateStatus = ['proof_uploaded', 'pending'].includes(order.transaction_status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground">Order details and management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.transaction_status)}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* COLUMN 1 */}
        <div className="space-y-6">
          {/* Order Details Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Order ID</label>
                  <p className="text-foreground font-mono text-sm break-all">{order.id}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Amount</label>
                  <p className="text-foreground text-lg font-bold">
                    {formatCurrency(order.amount, order.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Created</label>
                  <p className="text-foreground text-sm">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                  <p className="text-foreground text-sm">{formatRelativeTime(order.updated_at)}</p>
                </div>
              </div>

              {order.verified_by && order.verified_at && (
                <div className="border-border mt-4 border-t pt-4">
                  <label className="text-muted-foreground text-sm font-medium">Verified</label>
                  <p className="text-foreground text-sm">
                    {formatDate(order.verified_at)}
                    {order.verifier && (
                      <span className="text-muted-foreground"> by {order.verifier.full_name}</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">Full Name</label>
                <p className="text-foreground font-medium">{order.user.full_name}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">Email</label>
                <div className="flex items-center space-x-2">
                  <p className="text-foreground text-sm">{order.user.email}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onClick={() => window.open(`mailto:${order.user.email}`, '_blank')}
                  >
                    <Mail className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {metadata?.customer_info?.phone_number && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Phone</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-foreground text-sm">{metadata.customer_info.phone_number}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                      onClick={() =>
                        window.open(`tel:${metadata?.customer_info?.phone_number}`, '_blank')
                      }
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Registration Date
                </label>
                <p className="text-foreground text-sm">{formatDate(order.user.created_at)}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Current Plan Status
                </label>
                <p className="text-foreground text-sm">
                  {order.user.expires_at ? (
                    <>Active until {formatDate(order.user.expires_at)}</>
                  ) : (
                    'No active subscription'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.package ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Package Name
                      </label>
                      <p className="text-foreground font-medium">{order.package.name}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        Billing Period
                      </label>
                      <p className="text-foreground text-sm">
                        {metadata?.billing_period || order.package.billing_period}
                      </p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">Amount</label>
                      <p className="text-foreground text-lg font-bold">
                        {formatCurrency(order.amount, order.currency)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">Description</label>
                    <p className="text-muted-foreground text-sm">{order.package.description}</p>
                  </div>

                  {features && features.length > 0 && (
                    <div>
                      <label className="text-muted-foreground mb-2 block text-sm font-medium">
                        Features
                      </label>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="text-success mr-2 h-3 w-3 flex-shrink-0" />
                            <span className="text-foreground">
                              {typeof feature === 'string' ? feature : feature.name || 'Feature'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground text-sm">Package details not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity */}
          <OrderActivityTimeline
            transactionHistory={transaction_history}
            activityHistory={activity_history}
          />
        </div>

        {/* COLUMN 2 */}
        <div className="space-y-6">
          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUpdateStatus && (
                <div className="space-y-2">
                  <Button
                    onClick={() => openStatusModal('completed')}
                    className="bg-success hover:bg-success/90 text-success-foreground w-full"
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Payment
                  </Button>
                  <Button
                    onClick={() => openStatusModal('failed')}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full"
                    disabled={statusMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Payment
                  </Button>
                </div>
              )}

              <Separator className="bg-border" />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary w-full"
                  onClick={() => window.open(`mailto:${order.user.email}`, '_blank')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Customer
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary w-full"
                  onClick={() => router.push(`/users?search=${order.user.email}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View User Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">Gateway</label>
                <p className="text-foreground font-medium">{order.gateway?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">Payment Method</label>
                <p className="text-foreground text-sm">{order.payment_method}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Reference Number
                </label>
                <p className="text-foreground font-mono text-sm">{order.id}</p>
              </div>
              {order.gateway_transaction_id && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Gateway Transaction ID
                  </label>
                  <p className="text-foreground font-mono text-sm break-all">
                    {order.gateway_transaction_id}
                  </p>
                </div>
              )}
              {order.package && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Package</label>
                  <p className="text-foreground text-sm">
                    {order.package.name} ({metadata?.billing_period || order.package.billing_period}
                    )
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Proof */}
          {order.payment_proof_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Payment Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary flex aspect-video items-center justify-center rounded-lg">
                    <Image
                      src={order.payment_proof_url}
                      alt="Payment Proof"
                      width={640}
                      height={360}
                      className="max-h-full max-w-full rounded-lg object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
                          'hidden'
                        );
                      }}
                      unoptimized
                    />
                    <div className="hidden text-center">
                      <FileText className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                      <p className="text-muted-foreground text-sm">Unable to preview file</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(order.payment_proof_url!, '_blank')}
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.notes ? (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">Admin Notes</label>
                  <p className="bg-secondary text-foreground mt-1 rounded-lg p-3 text-sm">
                    {order.notes}
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">No notes added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && (
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {statusAction === 'completed' ? 'Approve Payment' : 'Reject Payment'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {statusAction === 'completed'
                  ? "This will immediately activate the customer's subscription and grant access to their selected plan."
                  : 'This will mark the payment as failed and notify the customer.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4">
                <h4 className="text-foreground mb-2 font-medium">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Order:</span>{' '}
                    <span className="text-foreground">#{order.id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Customer:</span>{' '}
                    <span className="text-foreground">{order.user.email}</span>
                  </p>
                  {order.package && (
                    <p>
                      <span className="text-muted-foreground">Package:</span>{' '}
                      <span className="text-foreground">
                        {order.package.name} ({metadata?.billing_period})
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Amount:</span>{' '}
                    <span className="text-foreground">
                      {formatCurrency(order.amount, order.currency)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Notes (optional)
                </label>
                <Textarea
                  placeholder={
                    statusAction === 'completed'
                      ? 'Payment verified and approved...'
                      : 'Payment rejected due to...'
                  }
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="border-border"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStatusModalOpen(false)}
                disabled={statusMutation.isPending}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={statusMutation.isPending}
                className={
                  statusAction === 'completed'
                    ? 'bg-success hover:bg-success/90 text-white'
                    : 'bg-destructive hover:bg-destructive/90 text-white'
                }
              >
                {statusMutation.isPending
                  ? 'Processing...'
                  : statusAction === 'completed'
                    ? 'Approve Payment'
                    : 'Reject Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
