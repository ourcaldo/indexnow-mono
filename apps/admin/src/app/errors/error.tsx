'use client';

import { RouteError } from '@/components/shared-primitives';

export default function ErrorsError(props: { error: Error; reset: () => void }) {
  return <RouteError {...props} message="Failed to load error logs" />;
}
