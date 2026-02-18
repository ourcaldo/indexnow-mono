'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  ErrorState,
} from '@indexnow/ui';
import {
  Activity,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { type Json, formatDate, type EnrichedActivityLog } from '@indexnow/shared';
import { getEventTypeBadge, getDeviceInfo } from './utils/activity-helpers';
import { useAdminActivity } from '@/hooks';

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState('7');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading: loading,
    error,
  } = useAdminActivity({
    days: dayFilter,
    page: currentPage,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || log.event_type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="bg-secondary min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-foreground text-2xl font-semibold">Activity Logs</h1>
            <p className="text-muted-foreground mt-2">Loading activity logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-foreground text-2xl font-semibold">Activity Logs</h1>
            <div className="mt-4">
              <ErrorState
                title="Failed to load activity logs"
                message={error.message}
                onRetry={() => window.location.reload()}
                variant="inline"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground text-2xl font-semibold">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">
            Track backend events, user actions (logins, changes, API calls), and system warnings or
            errors for audits and debugging
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-accent/10 rounded-lg p-2">
                  <Activity className="text-accent h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">{filteredLogs.length}</p>
                  <p className="text-muted-foreground text-xs">Total Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 rounded-lg p-2">
                  <User className="text-success h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {new Set(filteredLogs.map((l) => l.user_id)).size}
                  </p>
                  <p className="text-muted-foreground text-xs">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-success/10 rounded-lg p-2">
                  <Activity className="text-success h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {filteredLogs.filter((l) => l.success).length}
                  </p>
                  <p className="text-muted-foreground text-xs">Successful Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-destructive/10 rounded-lg p-2">
                  <Activity className="text-destructive h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {filteredLogs.filter((l) => !l.success).length}
                  </p>
                  <p className="text-muted-foreground text-xs">Failed Actions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    placeholder="Search by user name, email, action, or event type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login/Logout</SelectItem>
                    <SelectItem value="job_create">Job Management</SelectItem>
                    <SelectItem value="service_account_add">Service Accounts</SelectItem>
                    <SelectItem value="profile_update">Profile Updates</SelectItem>
                    <SelectItem value="api_call">API Calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Logs
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              Showing {filteredLogs.length} activities from all users (latest first)
            </p>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50" />
                <h3 className="text-foreground mb-2 text-lg font-medium">No activity logs found</h3>
                <p className="text-muted-foreground">
                  No user activities match your current filters
                </p>
              </div>
            ) : (
              <div className="border-border overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="text-foreground w-16 text-center font-semibold">
                        #
                      </TableHead>
                      <TableHead className="text-foreground text-center font-semibold">
                        Timestamp
                      </TableHead>
                      <TableHead className="text-foreground text-center font-semibold">
                        User
                      </TableHead>
                      <TableHead className="text-foreground text-center font-semibold">
                        Action/Event
                      </TableHead>
                      <TableHead className="text-foreground text-center font-semibold">
                        Device & IP
                      </TableHead>
                      <TableHead className="text-foreground text-center font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-foreground w-16 text-center font-semibold">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log, index) => {
                      const eventConfig = getEventTypeBadge(log.event_type, log.success);
                      const deviceInfo = getDeviceInfo(log.user_agent);
                      const IconComponent = eventConfig.icon;
                      const DeviceIcon = deviceInfo.icon;

                      return (
                        <TableRow
                          key={log.id}
                          className="hover:bg-secondary border-border border-b"
                        >
                          {/* Row Number */}
                          <TableCell className="text-muted-foreground text-center font-mono text-sm">
                            {(currentPage - 1) * 50 + index + 1}
                          </TableCell>

                          {/* Timestamp */}
                          <TableCell className="text-left">
                            <div className="text-foreground text-sm font-medium">
                              {formatDate(log.created_at)}
                            </div>
                          </TableCell>

                          {/* User Info */}
                          <TableCell className="text-left">
                            <Link
                              href={`/users/${log.user_id}`}
                              className="hover:text-accent transition-colors"
                            >
                              <div className="text-foreground text-sm font-medium">
                                {log.user_name}
                              </div>
                              <div className="text-muted-foreground max-w-[180px] truncate text-xs">
                                {log.user_email}
                              </div>
                            </Link>
                          </TableCell>

                          {/* Event/Action */}
                          <TableCell className="text-left">
                            <Badge className={`${eventConfig.color} mb-1 border-0 text-xs`}>
                              {eventConfig.label}
                            </Badge>
                            <div className="text-foreground text-sm">{log.action_description}</div>
                            {log.error_message && (
                              <div className="text-destructive bg-destructive/5 mt-1 rounded px-2 py-1 text-xs">
                                <strong>Error:</strong> {log.error_message}
                              </div>
                            )}
                          </TableCell>

                          {/* Device & IP */}
                          <TableCell className="text-center">
                            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1 text-sm">
                              <DeviceIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">{deviceInfo.text}</span>
                            </div>
                            {log.ip_address && (
                              <div className="text-muted-foreground text-xs">
                                <span className="bg-secondary rounded px-1.5 py-0.5 font-mono">
                                  {log.ip_address}
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {log.success ? (
                                <>
                                  <CheckCircle className="text-success h-4 w-4" />
                                  <span className="text-success text-sm font-medium">Success</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="text-destructive h-4 w-4" />
                                  <span className="text-destructive text-sm font-medium">
                                    Failed
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* View Details */}
                          <TableCell className="text-center">
                            <Link href={`/activity/${log.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-accent/10 hover:text-accent h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} entries
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
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
    </div>
  );
}
