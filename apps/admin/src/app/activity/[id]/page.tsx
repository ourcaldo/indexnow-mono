'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Copy, Check, SquareArrowOutUpRight } from 'lucide-react';
import { useAdminActivityDetail } from '@/hooks';
import { useAdminPageViewLogger } from '@indexnow/ui';
import { format } from 'date-fns';

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">{title}</h3></div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right max-w-[60%] break-all">{children}</span>
    </div>
  );
}

function CopyableId({ id, label }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 group font-mono text-sm text-gray-700 hover:text-gray-900 transition-colors" title={`Click to copy ${label ?? 'ID'}`}>
      {id}
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </button>
  );
}

function IdWithOpenButton({ id, href, label }: { id: string; href: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button onClick={handleCopy} className="inline-flex items-center gap-1 group text-sm text-gray-700 hover:text-gray-900 font-mono transition-colors" title={`Click to copy ${label ?? 'ID'}`}>
        {id}
        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </button>
      <button onClick={() => window.open(href, '_blank')} className="p-0.5 rounded text-gray-300 hover:text-blue-600 transition-colors" title={`Open ${label ?? 'detail'} in new tab`}>
        <SquareArrowOutUpRight className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  useAdminPageViewLogger('activity', 'Activity Detail', { activityId: id });
  const { data: activity, isLoading } = useAdminActivityDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />)}
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-sm text-gray-500">Activity not found</p>
        <button onClick={() => router.push('/activity')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Back to activity</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/activity')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Activity
      </button>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{activity.event_type}</h1>
          {activity.success ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle className="w-3 h-3" /> Success
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700 ring-1 ring-red-600/20">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <CopyableId id={activity.id} label="Activity ID" />
          <span className="text-gray-300">&middot;</span>
          <span className="text-sm text-gray-500">{format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
        </div>
      </div>

      <div className="space-y-4">
        <InfoCard title="Event Details">
          <InfoRow label="Activity ID"><CopyableId id={activity.id} label="Activity ID" /></InfoRow>
          <InfoRow label="Event type">{activity.event_type}</InfoRow>
          {activity.action_description && <InfoRow label="Description">{activity.action_description}</InfoRow>}
          {activity.target_type && <InfoRow label="Target type">{activity.target_type}</InfoRow>}
          {activity.target_id && <InfoRow label="Target ID"><span className="font-mono">{activity.target_id}</span></InfoRow>}
          {activity.error_message && <InfoRow label="Error"><span className="text-red-600">{activity.error_message}</span></InfoRow>}
        </InfoCard>

        {activity.user_id && (
          <InfoCard title="User">
            {activity.user_name && <InfoRow label="Name">{activity.user_name}</InfoRow>}
            {activity.user_email && <InfoRow label="Email">{activity.user_email}</InfoRow>}
            <InfoRow label="User ID">
              <IdWithOpenButton id={activity.user_id!} href={`/users/${activity.user_id}`} label="User ID" />
            </InfoRow>
          </InfoCard>
        )}

        {activity.ip_address && (
          <InfoCard title="Technical">
            <InfoRow label="IP Address">{activity.ip_address}</InfoRow>
            {activity.user_agent && <InfoRow label="User Agent">{activity.user_agent}</InfoRow>}
          </InfoCard>
        )}

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Metadata</h3></div>
            <div className="p-5">
              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-4 overflow-x-auto font-mono">{JSON.stringify(activity.metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
