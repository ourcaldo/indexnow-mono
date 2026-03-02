'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAdminActivityDetail } from '@/hooks';
import { format } from 'date-fns';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-gray-200 text-right max-w-[60%] break-all">{children}</span>
    </div>
  );
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: activity, isLoading } = useAdminActivityDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-gray-500">Activity not found</p>
        <button onClick={() => router.push('/activity')} className="text-sm text-gray-400 hover:text-white transition-colors">
          Back to activity
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.push('/activity')}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Activity
      </button>

      <div>
        <h1 className="text-lg font-semibold text-white">{activity.event_type}</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-white mb-3">Details</h2>
        <div>
          <DetailRow label="Event type">{activity.event_type}</DetailRow>
          {activity.action_description && <DetailRow label="Description">{activity.action_description}</DetailRow>}
          {activity.target_type && <DetailRow label="Target type">{activity.target_type}</DetailRow>}
          {activity.target_id && (
            <DetailRow label="Target ID">
              <span className="font-mono text-[12px] text-gray-500">{activity.target_id}</span>
            </DetailRow>
          )}
          <DetailRow label="Status">
            <span className={activity.success ? 'text-emerald-400' : 'text-red-400'}>
              {activity.success ? 'Success' : 'Failed'}
            </span>
          </DetailRow>
          {activity.error_message && <DetailRow label="Error">{activity.error_message}</DetailRow>}
        </div>
      </section>

      {activity.user_id && (
        <>
          <div className="border-t border-white/[0.06]" />
          <section>
            <h2 className="text-sm font-medium text-white mb-3">User</h2>
            <div>
              {activity.user_name && <DetailRow label="Name">{activity.user_name}</DetailRow>}
              {activity.user_email && <DetailRow label="Email">{activity.user_email}</DetailRow>}
              <DetailRow label="User ID">
                <button
                  onClick={() => router.push(`/users/${activity.user_id}`)}
                  className="text-[13px] text-gray-300 hover:text-white transition-colors"
                >
                  {activity.user_id}
                </button>
              </DetailRow>
            </div>
          </section>
        </>
      )}

      {activity.ip_address && (
        <>
          <div className="border-t border-white/[0.06]" />
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Technical</h2>
            <div>
              <DetailRow label="IP Address">{activity.ip_address}</DetailRow>
              {activity.user_agent && <DetailRow label="User Agent">{activity.user_agent}</DetailRow>}
            </div>
          </section>
        </>
      )}

      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
        <>
          <div className="border-t border-white/[0.06]" />
          <section>
            <h2 className="text-sm font-medium text-white mb-3">Metadata</h2>
            <pre className="text-[12px] text-gray-400 bg-white/[0.02] border border-white/[0.04] rounded-md p-3 overflow-x-auto">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
