interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

const lgGridColsMap: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

/**
 * (#110) Generic table skeleton for data table loading states.
 * @param rows Number of placeholder rows (default 5)
 * @param columns Number of columns (default 4)
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-background border-border overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="border-border bg-secondary flex gap-4 border-b px-6 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="border-border flex items-center gap-4 border-b px-6 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className={`h-4 flex-1 ${col === 0 ? 'max-w-[200px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * (#110) Stat card grid skeleton for admin dashboards.
 * @param count Number of stat cards (default 4)
 */
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${lgGridColsMap[Math.min(count, 4)] ?? 'lg:grid-cols-4'} gap-6`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-background border-border rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <Skeleton className="mb-2 h-7 w-16" />
          <Skeleton className="mb-1 h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * (#110) Full admin page loading skeleton with header, stats, and content area.
 */
export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <StatsCardsSkeleton count={4} />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-2">
      {/* Profile Information Skeleton */}
      <div className="card-default flex flex-col rounded-lg p-6">
        <Skeleton className="mb-6 h-6 w-48" />

        <div className="flex-1 space-y-6">
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div>
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mt-1 h-3 w-64" />
          </div>

          <div>
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Skeleton className="mt-6 h-10 w-32" />
      </div>

      {/* Password Change Skeleton */}
      <div className="card-default flex flex-col rounded-lg p-6">
        <Skeleton className="mb-6 h-6 w-40" />

        <div className="flex-1 space-y-6">
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div>
            <Skeleton className="mb-2 h-4 w-28" />
            <Skeleton className="h-12 w-full" />
          </div>

          <div>
            <Skeleton className="mb-2 h-4 w-36" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        <Skeleton className="mt-6 h-10 w-36" />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Skeleton className="mx-auto mb-4 h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}

export function AdminUserDetailSkeleton() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* User Profile Skeleton */}
      <div className="card-default rounded-xl p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="mb-2 h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-secondary border-border rounded-lg border p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Domain Header Skeleton */}
          <div className="card-default rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="mb-1 h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-secondary border-border rounded-lg border p-4">
                  <Skeleton className="mb-2 h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Keywords Skeleton */}
          <div className="card-default rounded-xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-secondary border-border flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-default rounded-xl p-6">
            <Skeleton className="mb-4 h-5 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApiQuotaSkeleton() {
  return (
    <div className="py-8 text-center">
      <Skeleton className="mx-auto mb-2 h-8 w-8 rounded-full" />
      <Skeleton className="mx-auto h-4 w-20" />
    </div>
  );
}

export function IndexNowFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="mb-1 h-8 w-32" />
        <Skeleton className="h-6 w-80" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form Skeleton */}
        <div className="lg:col-span-2">
          <div className="card-default rounded-lg p-6">
            <div className="mb-6 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>

            {/* Job Name Skeleton */}
            <div className="mb-6">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>

            {/* Tab Skeleton */}
            <div className="mb-6">
              <div className="border-border bg-secondary flex rounded-lg border p-1">
                <Skeleton className="mx-1 h-10 flex-1" />
                <Skeleton className="mx-1 h-10 flex-1" />
              </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="mb-6">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-32 w-full" />
              <div className="mt-2 flex justify-between">
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Schedule Skeleton */}
            <div className="border-border mb-6 border-t pt-4">
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-16" />
              </div>

              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-24" />
            </div>
          </div>
        </div>

        {/* API Quota Skeleton */}
        <div className="lg:col-span-1">
          <div className="card-default rounded-lg p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <ApiQuotaSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-default rounded-lg p-6">
            <div className="mb-4 flex items-center">
              <Skeleton className="mr-3 h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="mb-1 h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
