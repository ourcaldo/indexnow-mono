'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Checkbox,
  ErrorState,
} from '@indexnow/ui';
import { useToast } from '@indexnow/ui';

import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  type AdminOrdersResponse,
  type AdminOrderTransaction,
  type AdminOrderSummary,
} from '@indexnow/shared';
import { useAdminOrders } from '@/hooks';

interface OrderMetadata {
  customer_info?: {
    email?: string;
    [key: string]: unknown;
  };
  billing_period?: string;
  [key: string]: unknown;
}

const getSafeMetadata = (metadata: unknown): OrderMetadata => {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata as OrderMetadata;
  }
  return {};
};

export default function AdminOrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('all');

  const router = useRouter();
  const { addToast } = useToast();

  const {
    data: ordersData,
    isLoading: loading,
    error,
    refetch,
  } = useAdminOrders({
    page: currentPage,
    status: statusFilter,
    customer: customerSearch,
    packageId: packageFilter,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-muted/10 text-muted-foreground border-muted/20">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'proof_uploaded':
        return (
          <Badge variant="secondary" className="bg-muted/10 text-muted-foreground border-muted/20">
            <AlertCircle className="mr-1 h-3 w-3" />
            Waiting for Confirmation
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant="secondary"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted/10 text-muted-foreground border-muted/20">
            {status}
          </Badge>
        );
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && ordersData?.orders) {
      setSelectedOrders(ordersData.orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <ErrorState
          title="Error Loading Orders"
          message={error.message}
          onRetry={() => refetch()}
          showHomeButton
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">Manage and process payment orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:bg-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {ordersData?.summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {ordersData.summary.total_orders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-warning text-2xl font-bold">
                {ordersData.summary.proof_uploaded_orders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-success text-2xl font-bold">
                {ordersData.summary.completed_orders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {formatCurrency(ordersData.summary.total_revenue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="proof_uploaded">Proof Uploaded</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Customer Search
              </label>
              <Input
                placeholder="Search by name or email"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="border-border"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Package</label>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All packages</SelectItem>
                  {/* Add package options dynamically */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setStatusFilter('all');
                  setCustomerSearch('');
                  setPackageFilter('all');
                  setCurrentPage(1);
                }}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-secondary"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Orders</CardTitle>
            {selectedOrders.length > 0 && (
              <div className="text-muted-foreground text-sm">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedOrders.length === ordersData?.orders.length &&
                        ordersData?.orders.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-left">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData?.orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-secondary">
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOrder(order.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-left">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-foreground hover:text-primary block text-left font-medium transition-colors hover:underline"
                      >
                        #{order.id}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-foreground font-medium">{order.user.full_name}</div>
                        <div className="text-muted-foreground max-w-[200px] truncate text-sm">
                          {order.user.email ||
                            getSafeMetadata(order.metadata).customer_info?.email ||
                            'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-foreground font-medium">
                          {order.package?.name || 'Unknown Package'}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {getSafeMetadata(order.metadata).billing_period ||
                            order.package?.billing_period}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground font-medium">
                        {formatCurrency(order.amount)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.transaction_status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-foreground text-sm">
                          {formatRelativeTime(order.created_at)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleViewOrder(order.id)}
                            className="text-foreground hover:bg-secondary hover:text-foreground focus:bg-secondary focus:text-foreground"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {ordersData?.pagination && ordersData.pagination.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Showing{' '}
                {(ordersData.pagination.current_page - 1) * ordersData.pagination.items_per_page +
                  1}{' '}
                to{' '}
                {Math.min(
                  ordersData.pagination.current_page * ordersData.pagination.items_per_page,
                  ordersData.pagination.total_items
                )}{' '}
                of {ordersData.pagination.total_items} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!ordersData.pagination.has_prev}
                  className="border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">
                  Page {ordersData.pagination.current_page} of {ordersData.pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!ordersData.pagination.has_next}
                  className="border-border"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
