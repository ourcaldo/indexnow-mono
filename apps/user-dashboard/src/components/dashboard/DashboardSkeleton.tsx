'use client'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome header skeleton */}
      <div>
        <div className="h-7 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/60 rounded mt-2" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800/60 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keywords table skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800/60 rounded" />
                <div className="h-5 w-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800/60 rounded-full" />
              <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-800/60 rounded-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/60 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
