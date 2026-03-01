'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAdminActivityDetail } from '@/hooks';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <div className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value}</div>
    </div>
  );
}

function getDeviceBrowser(ua?: string | null): string {
  if (!ua) return 'Unknown';
  const u = ua.toLowerCase();
  const device = u.includes('mobile') || u.includes('iphone') ? 'Mobile'
    : u.includes('tablet') || u.includes('ipad') ? 'Tablet' : 'Desktop';
  const browser = u.includes('chrome') ? 'Chrome'
    : u.includes('firefox') ? 'Firefox'
    : u.includes('safari') ? 'Safari'
    : u.includes('edge') ? 'Edge' : 'Unknown';
  return `${device} · ${browser}`;
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  const { data: activity, isLoading, error } = useAdminActivityDetail(activityId);

  if (isLoading) return <div className="py-20 text-center text-sm text-gray-400">Loading…</div>;
  if (error || !activity) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>
      <div className="py-10 text-center space-y-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Activity not found</p>
        <p className="text-xs text-gray-400">{error?.message || 'The requested activity could not be found.'}</p>
      </div>
    </div>
  );

  const formattedDate = new Date(activity.created_at).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Activity detail</h1>
          <p className="text-xs font-mono text-gray-400 mt-0.5">{activity.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Primary Info */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs ${activity.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {activity.success ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                {activity.success ? 'Success' : 'Failed'}
              </span>
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{activity.event_type}</span>
            </div>
            <div className="space-y-4">
              <Row label="Description" value={<span className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md block">{activity.action_description}</span>} />
              <Row label="Time" value={formattedDate} />
              {activity.error_message && (
                <Row label="Error" value={<span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md block text-xs">{activity.error_message}</span>} />
              )}
              {activity.target_type && (
                <Row label="Target" value={
                  <span className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md block">
                    <span className="text-xs">{activity.target_type}</span>
                    {activity.target_id && <code className="ml-2 text-xs font-mono">{activity.target_id}</code>}
                  </span>
                } />
              )}
            </div>
          </div>

          {/* Metadata */}
          {activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata) && Object.keys(activity.metadata).length > 0 && (
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Additional data</p>
              <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md overflow-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Related Activities */}
          {activity.related_activities.length > 0 && (
            <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent activities from this user</p>
              <div className="space-y-1">
                {activity.related_activities.slice(0, 5).map((ra) => (
                  <Link key={ra.id} href={`/activity/${ra.id}`} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ra.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{ra.action_description}</span>
                    <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">{new Date(ra.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-5">
          {/* User */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">User</p>
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.user_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{activity.user_email}</p>
            </div>
            <Link href={`/users/${activity.user_id}`} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              View user profile
            </Link>
          </div>

          {/* Technical */}
          <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Technical details</p>
            <div className="space-y-3">
              <Row label="Device / Browser" value={getDeviceBrowser(activity.user_agent)} />
              {activity.ip_address && (
                <Row label="IP Address" value={<code className="text-xs font-mono bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded">{activity.ip_address}</code>} />
              )}
              {activity.user_agent && (
                <Row label="User Agent" value={<span className="text-xs break-all">{activity.user_agent}</span>} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
